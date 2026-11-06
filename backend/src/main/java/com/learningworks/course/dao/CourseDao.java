package com.learningworks.course.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.learningworks.course.vo.request.CourseMemberVO;
import com.learningworks.course.vo.request.ViewCourseVO;
import com.learningworks.course.vo.response.CourseVO;

@Mapper
public interface CourseDao {

	List<CourseVO> viewCourse();

	CourseVO readOneCourse(String courseId);

	CourseVO readMyCourse(String courseId);

	List<CourseMemberVO> courseMemeberList();

}
