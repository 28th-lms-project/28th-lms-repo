package com.learningworks.interview.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.interview.vo.request.InterviewRequestVO;
import com.learningworks.interview.vo.response.InterviewResponseVO;
import com.learningworks.interview.vo.response.InterviewStudentResponseVO;

@Mapper
public interface InterviewDao {

	/** 과정의 면접 일정. userId 가 null 이면 전체, 아니면 그 수강생(USER.ID) 본인 것만 */
	List<InterviewResponseVO> selectInterviewList(@Param("courseId") String courseId,
	                                              @Param("userId") String userId);


	List<InterviewStudentResponseVO> selectCourseStudentList(String courseId);

	int countCourseStudent(@Param("courseId") String courseId,
	                       @Param("courseStudentId") String courseStudentId);

	int insertInterview(InterviewRequestVO interviewRequestVO);
}
