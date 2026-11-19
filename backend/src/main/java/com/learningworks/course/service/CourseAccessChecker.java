package com.learningworks.course.service;

import java.util.List;
import org.springframework.stereotype.Component;
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
 */
@Component
public class CourseAccessChecker {

	/**
	 * 과정과 상관없이 모든 과정을 다룰 수 있는 역할.
	 * TODO: 역할 ID 비교(가이드 9장 "하지 말 것")라 권한 코드 기반으로 바꿀 예정. 판단은 이 클래스 한 곳에만 둔다.
	 */
	private static final List<String> COURSE_ADMIN_ROLES = List.of("ROLE_SUPER_ADMIN", "ROLE_ADMIN");

	/** 로그인 사용자와 과정의 관계 */
	public enum Relation {
		/** 이 과정의 강사 (강사이면서 수강생이어도 강사) */
		TUTOR,
		/** 과정에 등록되지 않은 관리자 */
		ADMIN,
		/** 이 과정의 수강생 */
		STUDENT
	}

	private final CourseDao courseDao;

	public CourseAccessChecker(CourseDao courseDao) {
		this.courseDao = courseDao;
	}

	/**
	 * 로그인 사용자와 과정의 관계. 강사 → 관리자 → 수강생 순으로 본다
	 * (관리자가 어떤 과정의 수강생으로도 등록돼 있으면 그 과정에서는 관리자로 본다: 조회 범위가 더 넓음).
	 * 어느 것도 아니면 403.
	 */
	public Relation relationOf(String courseId) {
		String loginId = AuthUtil.getLoginId();
		if (this.isTutor(courseId, loginId)) {
			return Relation.TUTOR;
		}
		if (this.isAdmin(loginId)) {
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

	/** 강사 기능: 이 과정의 강사 또는 관리자. 이 과정의 수강생 · 외부인은 403 */
	public void requireTutorOrAdmin(String courseId) {
		if (this.relationOf(courseId) == Relation.STUDENT) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}
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

	/** userId가 모든 과정을 다룰 수 있는 관리자인지 */
	public boolean isAdmin(String userId) {
		return COURSE_ADMIN_ROLES.contains(this.courseDao.readUserBaseRole(userId));
	}
}
