package com.learningworks.course.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.course.dao.CourseDao;
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

@Service
public class CourseServiceImpl implements CourseService{

	/** 모든 강의를 조회할 수 있는 역할. 그 외 역할은 자신이 속한(수강생 · 강사) 강의만 조회할 수 있다. */
	private static final List<String> COURSE_ADMIN_ROLES = List.of("ROLE_SUPER_ADMIN", "ROLE_ADMIN");

	/** 수강생 · 강사가 아니어도 모든 강의에 댓글을 작성할 수 있는 역할 */
	private static final String SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";

	/** 수강생 역할. 출석률 요약은 본인 것만 조회된다. */
	private static final String STUDENT_ROLE = "ROLE_STUDENT";

	private CourseDao courseDao;

	public CourseServiceImpl (CourseDao courseDao) {
		this.courseDao = courseDao;
	}

	@Override
	public List<CourseVO> viewCourse() {
		// 관리자는 전체 강의, 강사 · 수강생은 자신이 속한 강의만 조회한다. (userId 가 null 이면 전체)
		String loginId = AuthUtil.getLoginId();
		String userId = this.isCourseAdmin(loginId) ? null : loginId;
		// 목록 조회는 결과가 없으면 MyBatis가 빈 리스트를 반환하므로 별도 처리하지 않는다.
		return this.courseDao.viewCourse(userId);
	}

	@Override
	public CourseVO readOneCourse(String courseId) {
		CourseVO result = this.findCourse(courseId);
		this.checkCourseAccess(courseId);
		return result;
	}

	/** 강의 조회 (권한 검사 없음). 없으면 404 */
	private CourseVO findCourse(String courseId) {
		CourseVO result = this.courseDao.readOneCourse(courseId);
		if (result == null) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_EXISTS);
		}
		return result;
	}

	/**
	 * 로그인 사용자가 관리자(ROLE_SUPER_ADMIN, ROLE_ADMIN)인지 확인한다.
	 * 역할은 토큰이 아니라 DB의 현재 BASE_ROLE 기준으로 판단한다.
	 */
	private boolean isCourseAdmin(String loginId) {
		String baseRole = this.courseDao.readUserBaseRole(loginId);
		return COURSE_ADMIN_ROLES.contains(baseRole);
	}

	/**
	 * 강의 조회 권한 검사.
	 * - 관리자(ROLE_SUPER_ADMIN, ROLE_ADMIN): 모든 강의
	 * - 그 외(강사 · 수강생): 자신이 속한 강의만. 아니면 403 COURSE_NOT_AUTHORIZED
	 */
	private void checkCourseAccess(String courseId) {
		String loginId = AuthUtil.getLoginId();
		if (this.isCourseAdmin(loginId)) {
			return;
		}
		this.checkCourseMember(courseId, loginId);
	}

	/** 해당 강의의 수강생 · 강사인지 검사한다. 아니면 403 COURSE_NOT_AUTHORIZED */
	private void checkCourseMember(String courseId, String loginId) {
		if (this.courseDao.countCourseStudentOrTutor(courseId, loginId) == 0) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}
	}

	@Override
	public CourseVO readMyCourse(String courseId, String userId) {
		CourseVO result = this.courseDao.readMyCourse(courseId, userId);
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

		return this.findCourse(registCourseVO.getId());
	}

	@Override
	public List<CourseMemberVO> courseTutorList() {
		return this.courseDao.courseTutorList();
	}

	@Override
	public List<CourseMemberVO> readCourseMembers(String courseId) {
		this.checkCourseAccess(courseId);
		return this.courseDao.readCourseMembers(courseId);
	}

	@Override
	public List<HomeworkVO> courseHomeworkList(String courseId) {
		this.checkCourseAccess(courseId);
		return this.courseDao.readHomeworkList(courseId);
	}

	@Override
	public HomeworkVO getOneHomework(String courseId, String homeworkId) {
		this.checkCourseAccess(courseId);
		HomeworkVO result = this.courseDao.getOneHomework(courseId, homeworkId);
		if (result == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}
		return result;
	}

	@Override
	public HomeworkVO getHomeworkReplies(String courseId, String homeworkId) {
		this.checkCourseAccess(courseId);
		HomeworkVO result = this.courseDao.getHomeworkReplies(courseId, homeworkId);
		if (result == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}
		return result;
	}

	@Override
	public HomeworkReplyVO addHomeworkReply(String courseId, String homeworkId,
			RegistHomeworkReplyVO registHomeworkReplyVO) {
		// 강의에 속한 과제인지 확인
		HomeworkVO homework = this.courseDao.getOneHomework(courseId, homeworkId);
		if (homework == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}

		// 해당 강의의 수강생 · 강사와 ROLE_SUPER_ADMIN만 댓글을 작성할 수 있다.
		// (ROLE_ADMIN은 수강생 · 강사가 아니면 작성할 수 없다)
		String loginId = AuthUtil.getLoginId();
		if (!SUPER_ADMIN_ROLE.equals(this.courseDao.readUserBaseRole(loginId))) {
			this.checkCourseMember(courseId, loginId);
		}

		registHomeworkReplyVO.setHomeworkId(homeworkId);
		registHomeworkReplyVO.setCourseStudentId(loginId);

		int insertedRow = this.courseDao.addHomeworkReply(registHomeworkReplyVO);
		if (insertedRow == 0) {
			throw new LearningworksException(ErrorCode.HOMEWORK_REPLY_FAILURE_CREATE);
		}

		HomeworkReplyVO result = this.courseDao.readOneHomeworkReply(registHomeworkReplyVO.getId());
		if (result == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_REPLY_FAILURE_CREATE);
		}
		return result;
	}

	@Transactional
	@Override
	public HomeworkVO addHomework(String courseId, RegistHomeworkVO registHomeworkVO) {
		// 관리자(ROLE_SUPER_ADMIN, ROLE_ADMIN)는 모든 강의, 강사는 자기 강의에만 등록할 수 있다.
		// 학생은 COURSE_HOMEWORK_CREATE 권한을 부여하지 않고 프론트에서 버튼을 숨겨서 막는다.
		this.checkCourseAccess(courseId);

		registHomeworkVO.setCourseId(courseId);
		int insertedRow = this.courseDao.addHomework(registHomeworkVO);
		if (insertedRow == 0) {
			throw new LearningworksException(ErrorCode.HOMEWORK_FAILURE_CREATE);
		}

		// selectKey 로 채워진 id 로 등록된 과제를 다시 조회해서 반환한다.
		HomeworkVO result = this.courseDao.getOneHomework(courseId, registHomeworkVO.getId());
		if (result == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_FAILURE_CREATE);
		}
		return result;
	}

	@Transactional
	@Override
	public HomeworkVO updateHomework(String courseId, String homeworkId, ModifyHomeworkVO modifyHomeworkVO) {
		// 등록과 같은 권한: 관리자는 모든 강의, 강사는 자기 강의만.
		// 학생은 COURSE_HOMEWORK_UPDATE 권한을 부여하지 않아서 막는다.
		this.checkCourseAccess(courseId);

		// 강의에 속하고 삭제되지 않은 과제가 없으면 0 행이 수정된다.
		int updatedRow = this.courseDao.updateHomework(courseId, homeworkId, modifyHomeworkVO);
		if (updatedRow == 0) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}

		// 수정된 과제를 다시 조회해서 반환한다.
		HomeworkVO result = this.courseDao.getOneHomework(courseId, homeworkId);
		if (result == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}
		return result;
	}

	@Transactional
	@Override
	public HomeworkReplyVO updateHomeworkReply(String courseId, String homeworkId, String replyId,
			ModifyHomeworkReplyVO modifyHomeworkReplyVO) {
		// 강의에 속한 과제인지 확인
		if (this.courseDao.getOneHomework(courseId, homeworkId) == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}

		// 해당 과제의 삭제되지 않은 댓글인지 확인
		HomeworkReplyVO reply = this.courseDao.readOneHomeworkReply(replyId);
		if (reply == null || !homeworkId.equals(reply.getHomeworkId())) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}

		// 작성자 본인만 수정할 수 있다. (역할과 무관, 프론트는 본인 댓글에만 [수정] 버튼을 보여준다)
		String loginId = AuthUtil.getLoginId();
		if (!loginId.equals(reply.getCourseStudentId())) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}

		modifyHomeworkReplyVO.setId(replyId);
		modifyHomeworkReplyVO.setHomeworkId(homeworkId);
		modifyHomeworkReplyVO.setCourseStudentId(loginId);

		int updatedRow = this.courseDao.updateHomeworkReply(modifyHomeworkReplyVO);
		if (updatedRow == 0) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}

		// 수정된 댓글을 다시 조회해서 반환한다.
		HomeworkReplyVO result = this.courseDao.readOneHomeworkReply(replyId);
		if (result == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}
		return result;
	}

	@Transactional
	@Override
	public String deleteHomework(String courseId, String homeworkId) {
		// 수정과 같은 권한: 관리자는 모든 강의, 강사는 자기 강의만.
		// 학생은 COURSE_HOMEWORK_DELETE 권한을 부여하지 않아서 막는다.
		this.checkCourseAccess(courseId);

		// 실제로 지우지 않고 DEL_YN = 'Y' 로 표시한다. 강의에 속한 삭제되지 않은 과제가 없으면 0 행.
		int deletedRow = this.courseDao.deleteHomework(courseId, homeworkId);
		if (deletedRow == 0) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}
		return homeworkId;
	}

	@Transactional
	@Override
	public String deleteHomeworkReply(String courseId, String homeworkId, String replyId) {
		// 강의에 속한 과제인지 확인
		if (this.courseDao.getOneHomework(courseId, homeworkId) == null) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}

		// 해당 과제의 삭제되지 않은 댓글인지 확인
		HomeworkReplyVO reply = this.courseDao.readOneHomeworkReply(replyId);
		if (reply == null || !homeworkId.equals(reply.getHomeworkId())) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}

		// 작성자 본인, 관리자(ROLE_SUPER_ADMIN, ROLE_ADMIN), 해당 강의의 강사만 삭제할 수 있다.
		String loginId = AuthUtil.getLoginId();
		boolean isWriter = loginId.equals(reply.getCourseStudentId());
		if (!isWriter && !this.isCourseAdmin(loginId)
				&& this.courseDao.countCourseTutor(courseId, loginId) == 0) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}

		// 실제로 지우지 않고 DEL_YN = 'Y' 로 표시한다.
		int deletedRow = this.courseDao.deleteHomeworkReply(homeworkId, replyId);
		if (deletedRow == 0) {
			throw new LearningworksException(ErrorCode.HOMEWORK_NOT_EXISTS);
		}
		return replyId;
	}

	@Transactional
	@Override
	public List<CourseMemberVO> addCourseMember(String courseId, List<String> studentId) {
		RegistCourseStudentVO registCourseStudentVO = new RegistCourseStudentVO();
		registCourseStudentVO.setCourseId(courseId);
		for (String userId : studentId) {
			 registCourseStudentVO.setStudentId(userId);
			 int result = this.courseDao.addStudent(registCourseStudentVO);
			 if (result == 0) {
				 throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
			 }
		}
		return this.courseDao.readCourseMembers(courseId);
	}

	@Override
	public CourseVO updateCourse(String courseId, ModifyCourseVO modifyCourseVO) {
		int result = this.courseDao.updateCourse(courseId, modifyCourseVO);
		
		CourseVO course = this.courseDao.readOneCourse(courseId);
		return course;
	}

	/** 이 비율(진행된 수업일 대비 출석 인정일 %) 미만이면 출석 경고 */
	private static final double ATTENDANCE_WARNING_RATE = 80.0;

	/** 지각 이 횟수마다 결석 1번 */
	private static final int LATE_COUNT_PER_ABSENT = 3;

	@Override
	public AttendanceSummaryVO readAttendanceSummary(String courseId) {
		this.findCourse(courseId);        // 없는 강의면 404
		this.checkCourseAccess(courseId); // 관리자 또는 이 강의의 수강생 · 강사만

		// 수강생은 본인 것만, 관리자 · 강사는 강의 전체 수강생 (userId 가 null 이면 전체)
		String loginId = AuthUtil.getLoginId();
		String userId = STUDENT_ROLE.equals(this.courseDao.readUserBaseRole(loginId)) ? loginId : null;

		AttendanceSummaryVO summary = this.courseDao.readCourseClassDays(courseId);
		if (summary == null) {
			summary = new AttendanceSummaryVO();
		}
		int total = summary.getTotalClassDays();
		int passed = summary.getPassedClassDays();
		summary.setProgressRate(this.toPercent(passed, total));

		List<StudentAttendanceVO> students = this.courseDao.readStudentAttendanceCounts(courseId, userId);
		int attendedSum = 0;
		for (StudentAttendanceVO student : students) {
			int attended = this.countAttendedDays(student, passed);
			attendedSum += attended;
			student.setAttendanceRate(this.toPercent(attended, total));
			student.setWarning(this.isAttendanceWarning(attended, passed));
		}
		summary.setStudents(students);

		if (!students.isEmpty()) {
			double averageAttended = (double) attendedSum / students.size();
			double averageRate = students.stream().mapToDouble(StudentAttendanceVO::getAttendanceRate).average().orElse(0);
			summary.setAverageAttendanceRate(Math.round(averageRate * 10) / 10.0);
			summary.setAverageWarning(this.isAttendanceWarning(averageAttended, passed));
		}
		return summary;
	}

	/**
	 * 출석 인정일 = 진행된 수업일 - 결석 수
	 * 결석 수 = N + 기록 없는 수업일 + floor(L / 3)
	 */
	private int countAttendedDays(StudentAttendanceVO student, int passedClassDays) {
		int recorded = student.getPresentCount() + student.getLateCount() + student.getAbsentCount();
		int noRecordDays = Math.max(0, passedClassDays - recorded);
		int absentDays = student.getAbsentCount() + noRecordDays + student.getLateCount() / LATE_COUNT_PER_ABSENT;
		return Math.max(0, passedClassDays - absentDays);
	}

	/** 진행된 수업일 대비 출석 인정일이 80% 미만이면 true. 진행된 수업일이 0이면 false */
	private boolean isAttendanceWarning(double attendedDays, int passedClassDays) {
		return passedClassDays > 0 && attendedDays * 100.0 / passedClassDays < ATTENDANCE_WARNING_RATE;
	}

	/** part / total * 100 (소수 1자리). total 이 0이면 0 */
	private double toPercent(int part, int total) {
		if (total <= 0) {
			return 0;
		}
		return Math.round(part * 1000.0 / total) / 10.0;
	}

	

}
