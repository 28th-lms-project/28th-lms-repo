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
import com.learningworks.course.vo.response.TodayAttendanceSummaryVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.request.SearchCourseVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkReplyVO;
import com.learningworks.course.vo.response.HomeworkVO;
import com.learningworks.course.vo.response.StudentAttendanceVO;

@Mapper
public interface CourseDao {

	/**
	 * 삭제되지 않은 강의 목록 (시작일 늦은 순, 강의마다 한 줄).
	 * userId 가 null 이면 전체 강의, 아니면 해당 사용자가 수강생 · 강사인 강의만.
	 * name 은 강사 이름 (여럿이면 ", "로 연결, 없으면 null),
	 * myRelation 은 loginId 와 과정의 관계 (TUTOR · STUDENT · null)
	 */
	List<CourseVO> viewCourse(@Param("userId") String userId, @Param("loginId") String loginId);

	String readUserBaseRole(String userId);

	CourseVO readOneCourse(String courseId);

	/** 로그인 사용자가 수강 중인 강의 1건. 수강하지 않거나 삭제된 강의면 null */
	CourseVO readMyCourse(@Param("courseId") String courseId, @Param("userId") String userId);

	List<CourseMemberVO> courseMemeberList();

	int addCourse(RegistCourseVO registCourseVO);

	int addtutor(RegistCourseTutorVO registCourseTutorVO);

	int addStudent(RegistCourseStudentVO registCourseStudentVO);

	List<CourseMemberVO> courseTutorList();

	List<CourseMemberVO> readCourseMembers(String courseId);

	/** 과제 목록. submittedYn은 userId가 삭제되지 않은 댓글(제출)을 남겼는지 */
	List<HomeworkVO> readHomeworkList(@Param("courseId") String courseId, @Param("userId") String userId);

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

	/** 오늘이 이 과정의 수업일이면 1, 아니면 0 (과정 기간 안 시간표가 있는 날) */
	int countTodayClassDay(@Param("courseId") String courseId);

	/** 과정의 오늘 출석 기록 수 (수강생 수 · Y · L · N). classDay · notCheckedCount 는 채우지 않음 */
	TodayAttendanceSummaryVO readTodayAttendanceCounts(@Param("courseId") String courseId);

	/**
	 * 삭제되지 않은 과정의 시간표 날짜 중 startDate ~ endDate(yyyy-MM-dd) 밖인 날짜 (yyyy-MM-dd, 오름차순, 중복 없음).
	 * 과정 기간을 바꾸기 전에 검사한다
	 */
	List<String> selectTimetableDatesOutside(@Param("courseId") String courseId,
			@Param("startDate") String startDate, @Param("endDate") String endDate);

	/** 전체 수업일 수 · 어제까지 진행된 수업일 수 (totalClassDays, passedClassDays 만 채워짐). 수업일 = 과정 기간 안 시간표가 있는 날 */
	AttendanceSummaryVO readCourseClassDays(@Param("courseId") String courseId);

	/** 수강생별 Y / L / N 횟수 (어제까지). userId 가 null 이면 강의 전체 수강생 */
	List<StudentAttendanceVO> readStudentAttendanceCounts(@Param("courseId") String courseId,
			@Param("userId") String userId);

	/** 과정 목록 검색 (DEL_YN = 'N'). 비어 있는 조건은 제외 */
	List<CourseVO> searchCourseList(SearchCourseVO searchCourseVO);

	/** 과정 정보 수정 (기수 · 과정명 · 시작일 · 종료일) */
	int updateCourse(ModifyCourseVO modifyCourseVO);

	/** 과정 삭제 (DEL_YN = 'Y') */
	int deleteCourse(String courseId);

}
