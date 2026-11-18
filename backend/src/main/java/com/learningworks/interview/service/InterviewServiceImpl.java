package com.learningworks.interview.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.interview.dao.InterviewDao;
import com.learningworks.interview.vo.request.InterviewRequestVO;
import com.learningworks.interview.vo.response.InterviewResponseVO;
import com.learningworks.interview.vo.response.InterviewStudentResponseVO;

@Service
public class InterviewServiceImpl implements InterviewService {

	private final InterviewDao interviewDao;

	public InterviewServiceImpl(InterviewDao interviewDao) {
		this.interviewDao = interviewDao;
	}

	@Override
	@Transactional(readOnly = true)
	public List<InterviewResponseVO> getInterviewList(String courseId) {
		validateCourseId(courseId);
		return this.interviewDao.selectInterviewList(courseId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<InterviewStudentResponseVO> getCourseStudentList(String courseId) {
		validateCourseId(courseId);
		return this.interviewDao.selectCourseStudentList(courseId);
	}

	@Override
	@Transactional
	public String createInterview(String courseId, InterviewRequestVO interviewRequestVO) {
		validateCourseId(courseId);

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
