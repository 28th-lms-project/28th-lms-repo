package com.learningworks.course.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.request.ViewCourseVO;
import com.learningworks.course.vo.response.CourseVO;

@Service
public class CourseServiceImpl implements CourseService{
	
	private CourseDao courseDao;
	
	public CourseServiceImpl (CourseDao courseDao) {
		this.courseDao = courseDao;
	}

	@Override
	public List<CourseVO> viewCourse() {
		List<CourseVO> result = this.courseDao.viewCourse();
		
		if(result.equals(null)) {
			System.out.println("Error");
		}
		return result;
	}

	@Override
	public CourseVO readOneCourse(String courseId) {
		CourseVO result = this.courseDao.readOneCourse(courseId);
			
		return result;
	}

}
