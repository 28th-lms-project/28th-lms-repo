package com.learningworks.interview.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.interview.dao.InterviewDao;
import com.learningworks.interview.vo.request.InterviewRequestVO;
import com.learningworks.interview.vo.response.InterviewResponseVO;
import com.learningworks.interview.vo.response.InterviewStudentResponseVO;

@Service
public class InterviewServiceImpl implements InterviewService {

	/**
	 * 과정과 상관없이 모든 과정의 면접 일정을 다룰 수 있는 역할.
	 * CourseServiceImpl.COURSE_ADMIN_ROLES 와 같은 기준 (역할 ID 비교는 과정 쪽과 함께 권한 코드로 바꿀 예정)
	 */
	private static final List<String> COURSE_ADMIN_ROLES = List.of("ROLE_SUPER_ADMIN", "ROLE_ADMIN");

	/** 이 과정에서 로그인 사용자가 어떤 위치인지 */
	private enum CourseAccess { ADMIN, TUTOR, STUDENT }

	private final InterviewDao interviewDao;

	public InterviewServiceImpl(InterviewDao interviewDao) {
		this.interviewDao = interviewDao;
	}

	@Override
	@Transactional(readOnly = true)
	public List<InterviewResponseVO> getInterviewList(String courseId) {
		validateCourseId(courseId);
		// 면접 회사 · 일시는 개인 정보라 수강생에게는 본인 것만 준다 (강사 · 관리자는 과정 전체)
		String loginId = AuthUtil.getLoginId();
		CourseAccess access = this.checkCourseAccess(courseId, loginId);
		String userId = access == CourseAccess.STUDENT ? loginId : null;
		return this.interviewDao.selectInterviewList(courseId, userId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<InterviewStudentResponseVO> getCourseStudentList(String courseId) {
		validateCourseId(courseId);
		this.checkTutorOrAdmin(courseId);
		return this.interviewDao.selectCourseStudentList(courseId);
	}

	@Override
	@Transactional
	public String createInterview(String courseId, InterviewRequestVO interviewRequestVO) {
		validateCourseId(courseId);
		this.checkTutorOrAdmin(courseId);

		// 회사명 앞뒤 공백 제거 (공백만 입력한 경우는 @NotBlank 에서 차단)
		interviewRequestVO.setInterviewCompany(interviewRequestVO.getInterviewCompany().trim());
		interviewRequestVO.setCourseId(courseId);

		// 요청한 수강생이 실제로 해당 과정에 참여 중인지 서버에서 검증
		int count = this.interviewDao.countCourseStudent(courseId, interviewRequestVO.getCourseStudentId());
		if (count == 0) {
			throw new LearningworksException(ErrorCode.INTERVIEW_STUDENT_NOT_IN_COURSE);
		}

		// ID 는 Mapper 의 selectKey 로 생성 (SI-YYYYMMDD-NNNNNN)
		int insertCount = this.interviewDao.insertInterview(interviewRequestVO);
		if (insertCount != 1) {
			throw new LearningworksException(ErrorCode.INTERVIEW_FAILURE_CREATE);
		}

		return interviewRequestVO.getId();
	}

	/**
	 * 이 과정의 면접 일정을 다룰 수 있는지. 관리자 · 이 과정의 강사 · 이 과정의 수강생만, 아니면 403 COURSE_NOT_AUTHORIZED.
	 * 강사이면서 수강생인 경우는 강사로 본다.
	 */
	private CourseAccess checkCourseAccess(String courseId, String loginId) {
		if (this.interviewDao.countCourseTutor(courseId, loginId) > 0) {
			return CourseAccess.TUTOR;
		}
		if (this.interviewDao.countCourseStudentByUser(courseId, loginId) > 0) {
			return CourseAccess.STUDENT;
		}
		if (COURSE_ADMIN_ROLES.contains(this.interviewDao.selectUserBaseRole(loginId))) {
			return CourseAccess.ADMIN;
		}
		throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
	}

	/** 면접 일정 등록 · 등록용 수강생 조회: 관리자 또는 이 과정의 강사만 (수강생이면 403) */
	private void checkTutorOrAdmin(String courseId) {
		if (this.checkCourseAccess(courseId, AuthUtil.getLoginId()) == CourseAccess.STUDENT) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}
	}

	private void validateCourseId(String courseId) {
		if (courseId == null || courseId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_MISSING_PARAMETER);
		}
	}
}
