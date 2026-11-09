package com.learningworks.course.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.course.dao.CourseDao;
import com.learningworks.course.vo.request.RegistCourseStudentVO;
import com.learningworks.course.vo.request.RegistCourseTutorVO;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;

@Service
public class CourseServiceImpl implements CourseService{

	private CourseDao courseDao;

	public CourseServiceImpl (CourseDao courseDao) {
		this.courseDao = courseDao;
	}

	@Override
	public List<CourseVO> viewCourse() {
		// 목록 조회는 결과가 없으면 MyBatis가 빈 리스트를 반환하므로 별도 처리하지 않는다.
		return this.courseDao.viewCourse();
	}

	@Override
	public CourseVO readOneCourse(String courseId) {
		CourseVO result = this.courseDao.readOneCourse(courseId);
		if (result == null) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_EXISTS);
		}
		return result;
	}

	@Override
	public CourseVO readMyCourse(String courseId) {
		CourseVO result = this.courseDao.readMyCourse(courseId);
		if (result == null) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_EXISTS);
		}
		return result;
	}

	//나중에 분리할 endpoint
	@Override
	public List<CourseMemberVO> courseMemberList() {
		return this.courseDao.courseMemeberList();
	}

	@Transactional
	@Override
	public CourseVO addCourse(RegistCourseVO registCourseVO) {
		int courseResult = this.courseDao.addCourse(registCourseVO);
		if (courseResult == 0) {
			throw new LearningworksException(ErrorCode.GLOBAL_SYSTEM_ERROR);
		}

		RegistCourseTutorVO registCourseTutorVO = new RegistCourseTutorVO();
		registCourseTutorVO.setCourseId(registCourseVO.getId());
		registCourseTutorVO.setTutorId(registCourseVO.getTutorId());
		int tutorResult = this.courseDao.addtutor(registCourseTutorVO);
		if (tutorResult == 0) {
			throw new LearningworksException(ErrorCode.GLOBAL_SYSTEM_ERROR);
		}

		// 수강생을 선택하지 않으면 studentId 가 null 로 들어온다.
		List<String> studentIds = registCourseVO.getStudentId();
		if (studentIds != null) {
			for (String studentId : studentIds) {
				RegistCourseStudentVO registCourseStudentVO = new RegistCourseStudentVO();
				registCourseStudentVO.setCourseId(registCourseVO.getId());
				registCourseStudentVO.setStudentId(studentId);
				int studentResult = this.courseDao.addStudent(registCourseStudentVO);
				if (studentResult == 0) {
					throw new LearningworksException(ErrorCode.GLOBAL_SYSTEM_ERROR);
				}
			}
		}

		return this.readOneCourse(registCourseVO.getId());
	}

	@Override
	public List<CourseMemberVO> courseTutorList() {
		return this.courseDao.courseTutorList();
	}

	@Override
	public List<CourseMemberVO> readCourseMembers(String courseId) {
		return this.courseDao.readCourseMembers(courseId);
	}

}
