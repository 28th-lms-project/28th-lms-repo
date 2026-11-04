package com.learningworks.course.dao;

import org.apache.ibatis.annotations.Mapper;

import com.learningworks.course.vo.response.CourseVO;

@Mapper
public interface CourseDao {

	CourseVO viewCourse();

}
