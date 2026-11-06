package com.learningworks.course.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.request.RegistCourseStudentVO;
import com.learningworks.course.vo.request.RegistCourseTutorVO;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;

import jakarta.validation.Valid;

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

	@Override
	public CourseVO readMyCourse(String courseId) {
		CourseVO result = this.courseDao.readMyCourse(courseId);
		return result;
	}
	
	//나중에 분리할 endpoint
	@Override
	public List<CourseMemberVO> courseMemberList() {
		List<CourseMemberVO> CourseMemberVO = this.courseDao.courseMemeberList();
		return CourseMemberVO;
	}

	@Override
	public int addCourse(RegistCourseVO registCourseVO) {
		int studentResult = 0 ;
		RegistCourseTutorVO registCourseTutorVO = new RegistCourseTutorVO();
		RegistCourseStudentVO registCourseStudentVO = new RegistCourseStudentVO();
		int courseResult = this.courseDao.addCourse(registCourseVO);
		if (courseResult == 0) {
			System.out.println("course Error");
		}
		registCourseTutorVO.setCourseId(registCourseVO.getId());
		registCourseTutorVO.setTutorId(registCourseVO.getTutorId());
		int tutorResult = this.courseDao.addtutor(registCourseTutorVO); 
		if (tutorResult == 0) {
			System.out.println("toutor Error");
		}
		for( String student : registCourseVO.getStudentId()) {
			registCourseStudentVO.setCourseId(registCourseVO.getId());
			registCourseStudentVO.setStudentId(student);
			studentResult = this.courseDao.addStudent(registCourseStudentVO);
		}
		if (studentResult == 0) {
			System.out.println("student Error");
		}
		
		
		
		return 0;
	}

	@Override
	public List<CourseMemberVO> courseTutorList() {
		List<CourseMemberVO> courseMemberVO = this.courseDao.courseTutorList();
		return courseMemberVO;
	}
	
	
	
	

}
