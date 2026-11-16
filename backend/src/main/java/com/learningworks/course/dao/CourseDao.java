package com.learningworks.course.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.course.vo.request.ModifyCourseVO;
import com.learningworks.course.vo.request.ModifyHomeworkReplyVO;
import com.learningworks.course.vo.request.ModifyHomeworkVO;
import com.learningworks.course.vo.request.RegistCourseStudentVO;
import com.learningworks.course.vo.request.RegistCourseTutorVO;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.request.RegistHomeworkReplyVO;
import com.learningworks.course.vo.request.RegistHomeworkVO;
import com.learningworks.course.vo.response.AttendanceSummaryVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkReplyVO;
import com.learningworks.course.vo.response.HomeworkVO;
import com.learningworks.course.vo.response.StudentAttendanceVO;

@Mapper
public interface CourseDao {

	/** userId 가 null 이면 전체 강의, 아니면 해당 사용자가 수강생 · 강사인 강의만 */
	List<CourseVO> viewCourse(@Param("userId") String userId);

	String readUserBaseRole(String userId);

	CourseVO readOneCourse(String courseId);

	CourseVO readMyCourse(String courseId);

	List<CourseMemberVO> courseMemeberList();

	int addCourse(RegistCourseVO registCourseVO);

	int addtutor(RegistCourseTutorVO registCourseTutorVO);

	int addStudent(RegistCourseStudentVO registCourseStudentVO);

	List<CourseMemberVO> courseTutorList();

	List<CourseMemberVO> readCourseMembers(String courseId);

	List<HomeworkVO> readHomeworkList(String courseId);

	HomeworkVO getOneHomework(String courseId, String homeworkId);

	HomeworkVO getHomeworkReplies(String courseId, String homeworkId);

	int addHomeworkReply(RegistHomeworkReplyVO registHomeworkReplyVO);

	HomeworkReplyVO readOneHomeworkReply(String replyId);

	int countCourseStudentOrTutor(@Param("courseId") String courseId, @Param("userId") String userId);

	int addHomework(RegistHomeworkVO registHomeworkVO);

	int updateHomework(String courseId, String homeworkId, ModifyHomeworkVO modifyHomeworkVO);

	int updateHomeworkReply(ModifyHomeworkReplyVO modifyHomeworkReplyVO);

	int deleteHomework(@Param("courseId") String courseId, @Param("homeworkId") String homeworkId);

	int deleteHomeworkReply(@Param("homeworkId") String homeworkId, @Param("replyId") String replyId);

	int countCourseTutor(@Param("courseId") String courseId, @Param("userId") String userId);

	int updateCourse(@Param("courseId")String courseId, @Param("modifyCourseVO")ModifyCourseVO modifyCourseVO);

	/** 전체 수업일 수 · 어제까지 진행된 수업일 수 (totalClassDays, passedClassDays 만 채워짐) */
	AttendanceSummaryVO readCourseClassDays(@Param("courseId") String courseId);

	/** 수강생별 Y / L / N 횟수 (어제까지). userId 가 null 이면 강의 전체 수강생 */
	List<StudentAttendanceVO> readStudentAttendanceCounts(@Param("courseId") String courseId,
			@Param("userId") String userId);

}
