package com.learningworks.interview.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.course.service.CourseAccessChecker;
import com.learningworks.interview.dao.InterviewDao;
import com.learningworks.interview.vo.request.InterviewRequestVO;
import com.learningworks.interview.vo.response.InterviewResponseVO;
import com.learningworks.interview.vo.response.InterviewStudentResponseVO;

@Service
public class InterviewServiceImpl implements InterviewService {

	private final InterviewDao interviewDao;

	/** 과정 단위 권한 확인 (목록: 강사 · 관리자는 전체, 수강생은 본인 것만 / 등록: 강사 · 관리자) */
	private final CourseAccessChecker courseAccess;

	public InterviewServiceImpl(InterviewDao interviewDao, CourseAccessChecker courseAccess) {
		this.interviewDao = interviewDao;
		this.courseAccess = courseAccess;
	}

	@Override
	@Transactional(readOnly = true)
	public List<InterviewResponseVO> getInterviewList(String courseId) {
		validateCourseId(courseId);
		// 면접 회사 · 일시는 개인 정보라 수강생에게는 본인 것만 준다 (강사 · 관리자는 과정 전체)
		CourseAccessChecker.Relation relation = this.courseAccess.relationOf(courseId);
		String userId = relation == CourseAccessChecker.Relation.STUDENT ? AuthUtil.getLoginId() : null;
		return this.interviewDao.selectInterviewList(courseId, userId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<InterviewStudentResponseVO> getCourseStudentList(String courseId) {
		validateCourseId(courseId);
		this.courseAccess.requireTutorOrAdmin(courseId);
		return this.interviewDao.selectCourseStudentList(courseId);
	}

	@Override
	@Transactional
	public String createInterview(String courseId, InterviewRequestVO interviewRequestVO) {
		validateCourseId(courseId);
		this.courseAccess.requireTutorOrAdmin(courseId);

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

	private void validateCourseId(String courseId) {
		if (courseId == null || courseId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_MISSING_PARAMETER);
		}
	}
}
