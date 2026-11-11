package com.learningworks.interview.service;

import java.util.List;

import com.learningworks.interview.vo.request.InterviewRequestVO;
import com.learningworks.interview.vo.response.InterviewResponseVO;
import com.learningworks.interview.vo.response.InterviewStudentResponseVO;

public interface InterviewService {

	/** 과정의 면접 일정 목록 조회 (면접일시 오름차순) */
	List<InterviewResponseVO> getInterviewList(String courseId);

	/** 과정의 수강생 목록 조회 (면접 일정 등록 Select Box 용) */
	List<InterviewStudentResponseVO> getCourseStudentList(String courseId);

	/** 면접 일정 등록. 생성된 면접 일정 ID 반환 */
	String createInterview(String courseId, InterviewRequestVO interviewRequestVO);
}
