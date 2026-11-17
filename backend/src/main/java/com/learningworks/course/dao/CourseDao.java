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
import com.learningworks.course.vo.request.SearchCourseVO;
import com.learningworks.course.vo.response.CourseMemberVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkReplyVO;
import com.learningworks.course.vo.response.HomeworkVO;

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

	/** 과정 목록 검색 (DEL_YN = 'N'). 비어 있는 조건은 제외 */
	List<CourseVO> searchCourseList(SearchCourseVO searchCourseVO);

	/** 과정 정보 수정 (기수 · 과정명 · 시작일 · 종료일) */
	int updateCourse(ModifyCourseVO modifyCourseVO);

	/** 과정 삭제 (DEL_YN = 'Y') */
	int deleteCourse(String courseId);

}
