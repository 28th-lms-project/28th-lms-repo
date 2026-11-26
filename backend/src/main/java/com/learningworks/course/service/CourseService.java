package com.learningworks.course.service;

import java.util.List;

import com.learningworks.course.vo.request.ModifyCourseVO;
import com.learningworks.course.vo.request.ModifyHomeworkReplyVO;
import com.learningworks.course.vo.request.ModifyHomeworkVO;
import com.learningworks.course.vo.request.RegistCourseVO;
import com.learningworks.course.vo.request.RegistHomeworkReplyVO;
import com.learningworks.course.vo.request.RegistHomeworkVO;
import com.learningworks.course.vo.response.AttendanceSummaryVO;
import com.learningworks.course.vo.response.TodayAttendanceSummaryVO;
import com.learningworks.course.vo.request.SearchCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkReplyVO;
import com.learningworks.course.vo.response.HomeworkVO;

public interface CourseService {

	List<CourseVO> viewCourse();

	CourseVO readOneCourse(String courseId);

	CourseVO readMyCourse(String courseId, String string);

	List<CourseMemberVO> courseMemberList();

	CourseVO addCourse(RegistCourseVO registCourseVO);

	List<CourseMemberVO> courseTutorList();

	List<CourseMemberVO> readCourseMembers(String courseId);

	List<HomeworkVO> courseHomeworkList(String courseId);

	HomeworkVO getOneHomework(String courseId, String homeworkId);

	HomeworkVO getHomeworkReplies(String courseId, String homeworkId);

	HomeworkReplyVO addHomeworkReply(String courseId, String homeworkId, RegistHomeworkReplyVO registHomeworkReplyVO);

	HomeworkVO addHomework(String courseId, RegistHomeworkVO registHomeworkVO);

	HomeworkVO updateHomework(String courseId, String homeworkId, ModifyHomeworkVO modifyHomeworkVO);

	HomeworkReplyVO updateHomeworkReply(String courseId, String homeworkId, String replyId,
			ModifyHomeworkReplyVO modifyHomeworkReplyVO);

	String deleteHomework(String courseId, String homeworkId);

	String deleteHomeworkReply(String courseId, String homeworkId, String replyId);

	List<CourseMemberVO> addCourseMember(String courseId, List<String> studentId);

	/** 강의 진행률 · 출석률 요약 (어제까지 기준). 수강생은 본인만 */
	AttendanceSummaryVO readAttendanceSummary(String courseId);

	/** 과정의 오늘 출석 현황 (강사 · 관리자). 이 과정의 수강생이면 COURSE_NOT_AUTHORIZED */
	TodayAttendanceSummaryVO readTodayAttendance(String courseId);

	List<CourseVO> searchCourseList(SearchCourseVO searchCourseVO);

	String updateCourse(String courseId, ModifyCourseVO modifyCourseVO);

	String deleteCourse(String courseId);

}
