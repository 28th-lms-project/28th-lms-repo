package com.learningworks.interview.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.interview.vo.request.InterviewRequestVO;
import com.learningworks.interview.vo.response.InterviewResponseVO;
import com.learningworks.interview.vo.response.InterviewStudentResponseVO;

@Mapper
public interface InterviewDao {

	List<InterviewResponseVO> selectInterviewList(String courseId);

	List<InterviewStudentResponseVO> selectCourseStudentList(String courseId);

	int countCourseStudent(@Param("courseId") String courseId,
	                       @Param("courseStudentId") String courseStudentId);

	int insertInterview(InterviewRequestVO interviewRequestVO);
}
