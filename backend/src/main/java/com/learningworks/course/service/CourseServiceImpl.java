package com.learningworks.course.service;

import org.springframework.stereotype.Service;

import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.response.CourseVO;

@Service
public class CourseServiceImpl implements CourseService{
	
	private CourseDao courseDao;
	
	public CourseServiceImpl (CourseDao courseDao) {
		this.courseDao = courseDao;
	}

	@Override
	public CourseVO viewCourse() {
		CourseVO result = this.courseDao.viewCourse();
		
		if(result.equals(null)) {
			System.out.println("Error");
		}
		return result;
	}

}
