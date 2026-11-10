package com.learningworks.course.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.learningworks.course.vo.request.RegistCourseStudentVO;
import com.learningworks.course.vo.request.RegistCourseTutorVO;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkVO;

@Mapper
public interface CourseDao {

	List<CourseVO> viewCourse();

	CourseVO readOneCourse(String courseId);

	CourseVO readMyCourse(String courseId);

	List<CourseMemberVO> courseMemeberList();

	int addCourse(RegistCourseVO registCourseVO);

	int addtutor(RegistCourseTutorVO registCourseTutorVO);

	int addStudent(RegistCourseStudentVO registCourseStudentVO);

	List<CourseMemberVO> courseTutorList();

	List<CourseMemberVO> readCourseMembers(String courseId);

	List<HomeworkVO> readHomeworkList(String courseId);

}
