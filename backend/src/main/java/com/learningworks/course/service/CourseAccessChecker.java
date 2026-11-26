package com.learningworks.course.service;

import java.util.List;
import org.springframework.stereotype.Component;
import com.learningworks.common.action.AccessChecker;
import com.learningworks.common.action.ActionCodeDeclarer;
import com.learningworks.common.action.DeclaredActionCode;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.course.dao.CourseDao;

/**
 * 과정 단위 권한 확인 (frontend/docs/design/dashboard-design.md 3-1 "과정 단위 권한 원칙").
 *
 * 권한 코드(@RequireAction)는 "이 종류의 기능을 쓸 수 있는 사람인가"만 본다. 이 클래스는 그 위에
 * "이 과정에서 그 일을 할 위치인가"(COURSE_TUTOR · COURSE_STUDENT 등록)를 확인한다.
 * - 강사 기능 (과제 관리 · 시험 세트 · 채점 · 학생 추가 · 상담 · 면접 등록): requireTutorOrAdmin
 * - 수강생 기능 (시험 응시 등): requireStudent
 * - 과정 화면 조회: requireMember
 *
 * 역할이 무엇이든(예: 강사 역할인 사람이 다른 과정의 수강생) 한 과정 안에서는 그 과정의 관계대로만 행동하게 된다.
 * 실패하면 403 COURSE_NOT_AUTHORIZED.
 *
 * 과정에 등록되지 않은 사람(관리자 · 조회 전용 등)은 역할 ID가 아니라 아래 두 권한 코드로 판단한다 (가이드 9장).
 * 두 코드는 API에 붙지 않으므로 ActionCodeDeclarer로 선언하고, 권한 관리 화면에서 역할에 부여한다.
 * - COURSE_ALL_READ: 등록되지 않은 과정도 조회 (과정 목록 전체 · 과정 화면 · 출석 요약 · 성적 전체 등)
 * - COURSE_ALL_MANAGE: 등록되지 않은 과정도 관리 (과제 · 시험 · 채점 · 학생 추가 · 상담 · 면접 등록 등)
 * SUPER_ADMIN은 AccessChecker가 항상 통과시킨다.
 */
@Component
public class CourseAccessChecker implements ActionCodeDeclarer {

	/** 과정에 등록되지 않아도 모든 과정을 조회 */
	public static final DeclaredActionCode ALL_READ =
			new DeclaredActionCode("COURSE", "ALL_READ", "모든 과정 조회 (과정에 등록되지 않아도)");

	/** 과정에 등록되지 않아도 모든 과정을 관리 */
	public static final DeclaredActionCode ALL_MANAGE =
			new DeclaredActionCode("COURSE", "ALL_MANAGE", "모든 과정 관리 (과정에 등록되지 않아도)");

	/** 로그인 사용자와 과정의 관계 */
	public enum Relation {
		/** 이 과정의 강사 (강사이면서 수강생이어도 강사) */
		TUTOR,
		/** 과정에 등록되지 않았지만 모든 과정을 조회할 수 있는 사람 (COURSE_ALL_READ) */
		ADMIN,
		/** 이 과정의 수강생 */
		STUDENT
	}

	private final CourseDao courseDao;
	private final AccessChecker accessChecker;

	public CourseAccessChecker(CourseDao courseDao, AccessChecker accessChecker) {
		this.courseDao = courseDao;
		this.accessChecker = accessChecker;
	}

	@Override
	public List<DeclaredActionCode> declaredActionCodes() {
		return List.of(ALL_READ, ALL_MANAGE);
	}

	/**
	 * 로그인 사용자와 과정의 관계 (조회 기준). 강사 → 모든 과정 조회 권한(COURSE_ALL_READ) → 수강생 순으로 본다
	 * (모든 과정 조회 권한이 있는 사람이 어떤 과정의 수강생이기도 하면 그 과정에서는 ADMIN으로 본다: 조회 범위가 더 넓음).
	 * 어느 것도 아니면 403.
	 */
	public Relation relationOf(String courseId) {
		String loginId = AuthUtil.getLoginId();
		if (this.isTutor(courseId, loginId)) {
			return Relation.TUTOR;
		}
		if (this.canReadAll(loginId)) {
			return Relation.ADMIN;
		}
		if (this.isStudent(courseId, loginId)) {
			return Relation.STUDENT;
		}
		throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
	}

	/** 과정 화면 조회: 이 과정의 강사 · 수강생 또는 관리자. 아니면 403 */
	public Relation requireMember(String courseId) {
		return this.relationOf(courseId);
	}

	/**
	 * 강사 기능: 이 과정의 강사 또는 모든 과정 관리 권한(COURSE_ALL_MANAGE).
	 * 이 과정의 수강생 · 외부인 · 조회만 가능한 사람(COURSE_ALL_READ만 있음)은 403
	 */
	public void requireTutorOrAdmin(String courseId) {
		String loginId = AuthUtil.getLoginId();
		if (this.isTutor(courseId, loginId) || this.canManageAll(loginId)) {
			return;
		}
		throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
	}

	/** 수강생 기능 (시험 응시 등): 이 과정의 수강생만. 관리자 · 강사라도 수강생으로 등록돼 있지 않으면 403 */
	public void requireStudent(String courseId) {
		if (!this.isStudent(courseId, AuthUtil.getLoginId())) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}
	}

	/** userId가 이 과정의 강사인지 */
	public boolean isTutor(String courseId, String userId) {
		return this.courseDao.countCourseTutor(courseId, userId) > 0;
	}

	/** userId가 이 과정의 수강생인지 (강사 등록과 상관없이 COURSE_STUDENT 기준) */
	public boolean isStudent(String courseId, String userId) {
		int studentOrTutor = this.courseDao.countCourseStudentOrTutor(courseId, userId);
		int tutor = this.courseDao.countCourseTutor(courseId, userId);
		return studentOrTutor - tutor > 0;
	}

	/** userId가 등록되지 않은 과정도 조회할 수 있는지 (COURSE_ALL_READ, SUPER_ADMIN은 항상 true) */
	public boolean canReadAll(String userId) {
		return this.accessChecker.hasAction(userId, ALL_READ.actionCode());
	}

	/** userId가 등록되지 않은 과정도 관리할 수 있는지 (COURSE_ALL_MANAGE, SUPER_ADMIN은 항상 true) */
	public boolean canManageAll(String userId) {
		return this.accessChecker.hasAction(userId, ALL_MANAGE.actionCode());
	}
}
