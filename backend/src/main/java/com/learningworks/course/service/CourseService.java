package com.learningworks.course.service;

import java.util.List;

import com.learningworks.course.vo.request.ViewCourseVO;
import com.learningworks.course.vo.response.CourseVO;

public interface CourseService {

	List<CourseVO> viewCourse();

	CourseVO readOneCourse(String courseId);

}
