package com.learningworks.course.service;

import java.util.List;

import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;

import jakarta.validation.Valid;

public interface CourseService {

	List<CourseVO> viewCourse();

	CourseVO readOneCourse(String courseId);

	CourseVO readMyCourse(String courseId);

	List<CourseMemberVO> courseMemberList();

	int addCourse(RegistCourseVO registCourseVO);

	List<CourseMemberVO> courseTutorList();

}
