package com.learningworks.course.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.common.utils.DateListText;
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
import com.learningworks.course.vo.request.SearchCourseVO;
import com.learningworks.course.vo.response.CourseVO;
import com.learningworks.course.vo.response.HomeworkReplyVO;
import com.learningworks.course.vo.response.HomeworkVO;
import com.learningworks.course.vo.response.StudentAttendanceVO;
import com.learningworks.course.vo.response.TodayAttendanceSummaryVO;

@Service
public class CourseServiceImpl implements CourseService{

	/** 수강생 · 강사가 아니어도 모든 강의에 댓글을 작성할 수 있는 역할 */
	private static final String SUPER_ADMIN_ROLE = "ROLE_SUPER_ADMIN";

	private CourseDao courseDao;

	/** 과정 단위 권한 확인 (과제 관리 · 학생 추가는 이 과정의 강사 또는 COURSE_ALL_MANAGE) */
	private final CourseAccessChecker courseAccess;

	public CourseServiceImpl (CourseDao courseDao, CourseAccessChecker courseAccess) {
		this.courseDao = courseDao;
		this.courseAccess = courseAccess;
	}

	@Override
	public List<CourseVO> viewCourse() {
		// 관리자는 전체 강의, 강사 · 수강생은 자신이 속한 강의만 조회한다. (userId 가 null 이면 전체)
		String loginId = AuthUtil.getLoginId();
		String userId = this.courseAccess.canReadAll(loginId) ? null : loginId;
		// 목록 조회는 결과가 없으면 MyBatis가 빈 리스트를 반환하므로 별도 처리하지 않는다.
		// 과정마다 로그인 사용자와의 관계(myRelation)를 함께 준다 (관리자도 자기가 등록된 과정은 표시됨)
		return this.courseDao.viewCourse(userId, loginId);
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
	 * 강의 조회 권한 검사.
	 * - 관리자(ROLE_SUPER_ADMIN, ROLE_ADMIN): 모든 강의
	 * - 그 외(강사 · 수강생): 자신이 속한 강의만. 아니면 403 COURSE_NOT_AUTHORIZED
	 */
	private void checkCourseAccess(String courseId) {
		String loginId = AuthUtil.getLoginId();
		// 등록되지 않은 과정도 조회할 수 있는 사람 (COURSE_ALL_READ)
		if (this.courseAccess.canReadAll(loginId)) {
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
			// 같은 과정에 강사와 수강생으로 함께 등록하지 않는다 (역할이 아니라 과정 관계로 판단)
			if (studentIds.contains(registCourseVO.getTutorId())) {
				throw new LearningworksException(ErrorCode.COURSE_TUTOR_STUDENT_CONFLICT);
			}
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
		// 제출 여부(submittedYn)는 로그인 사용자 기준 (시험 세트 목록의 submittedYn과 같은 방식)
		return this.courseDao.readHomeworkList(courseId, AuthUtil.getLoginId());
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
		// 관리자는 모든 강의, 강사는 자기 강의에만 등록할 수 있다.
		// 이 과정의 수강생은 권한 코드가 있어도(예: 강사 역할인 사람이 다른 과정을 수강) 막는다.
		this.courseAccess.requireTutorOrAdmin(courseId);

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
		// 등록과 같은 권한: 관리자는 모든 강의, 강사는 자기 강의만 (이 과정의 수강생은 403)
		this.courseAccess.requireTutorOrAdmin(courseId);

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
		// 수정과 같은 권한: 관리자는 모든 강의, 강사는 자기 강의만 (이 과정의 수강생은 403)
		this.courseAccess.requireTutorOrAdmin(courseId);

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

		// 작성자 본인, 모든 과정 관리 권한(COURSE_ALL_MANAGE), 해당 강의의 강사만 삭제할 수 있다.
		String loginId = AuthUtil.getLoginId();
		boolean isWriter = loginId.equals(reply.getCourseStudentId());
		if (!isWriter && !this.courseAccess.canManageAll(loginId)
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
		this.findCourse(courseId);                       // 없는 강의면 404
		this.courseAccess.requireTutorOrAdmin(courseId); // 이 과정의 강사 또는 관리자만 학생을 추가
		RegistCourseStudentVO registCourseStudentVO = new RegistCourseStudentVO();
		registCourseStudentVO.setCourseId(courseId);
		for (String userId : studentId) {
			// 같은 과정에 강사와 수강생으로 함께 등록하지 않는다 (역할이 아니라 과정 관계로 판단)
			if (this.courseAccess.isTutor(courseId, userId)) {
				throw new LearningworksException(ErrorCode.COURSE_TUTOR_STUDENT_CONFLICT);
			}
			 registCourseStudentVO.setStudentId(userId);
			 int result = this.courseDao.addStudent(registCourseStudentVO);
			 if (result == 0) {
				 throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
			 }
		}
		return this.courseDao.readCourseMembers(courseId);
	}

	/** 이 비율(진행된 수업일 대비 출석 인정일 %) 미만이면 출석 경고 */
	private static final double ATTENDANCE_WARNING_RATE = 80.0;

	/** 지각 이 횟수마다 결석 1번 */
	private static final int LATE_COUNT_PER_ABSENT = 3;

	@Override
	public AttendanceSummaryVO readAttendanceSummary(String courseId) {
		this.findCourse(courseId);        // 없는 강의면 404
		this.checkCourseAccess(courseId); // 관리자 또는 이 강의의 수강생 · 강사만

		// 이 강의의 수강생으로 등록된 사람은 본인 것만, 그 외(관리자 · 강사)는 강의 전체 수강생 (userId 가 null 이면 전체)
		// 역할 이름이 아니라 COURSE_STUDENT 등록 여부로 판단한다 (access-control-guide 9장)
		String loginId = AuthUtil.getLoginId();
		String userId = this.isCourseStudent(courseId, loginId) ? loginId : null;

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
			int attended = this.fillAbsentCounts(student, passed);
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

	@Override
	public TodayAttendanceSummaryVO readTodayAttendance(String courseId) {
		this.findCourse(courseId);        // 없는 강의면 404
		this.checkCourseAccess(courseId); // 관리자 또는 이 강의의 수강생 · 강사만

		// 다른 수강생의 출석 현황이라 수강생에게는 주지 않는다 (본인 출결은 GET /attendances/{courseId}/today)
		if (this.isCourseStudent(courseId, AuthUtil.getLoginId())) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}

		TodayAttendanceSummaryVO summary = this.courseDao.readTodayAttendanceCounts(courseId);
		if (summary == null) {
			summary = new TodayAttendanceSummaryVO();
		}
		summary.setClassDay(this.courseDao.countTodayClassDay(courseId) > 0);
		int checked = summary.getPresentCount() + summary.getLateCount() + summary.getAbsentCount();
		summary.setNotCheckedCount(Math.max(0, summary.getStudentCount() - checked));
		return summary;
	}

	/** 이 강의의 수강생(COURSE_STUDENT)인지. (수강생 + 강사 수) - 강사 수 */
	private boolean isCourseStudent(String courseId, String userId) {
		int studentOrTutor = this.courseDao.countCourseStudentOrTutor(courseId, userId);
		int tutor = this.courseDao.countCourseTutor(courseId, userId);
		return studentOrTutor - tutor > 0;
	}

	/**
	 * 결석 환산 값을 student에 채우고 출석 인정일을 돌려준다.
	 * 기록 없는 수업일 = 진행된 수업일 - (Y + L + N)
	 * 최종 결석 수 = N + 기록 없는 수업일 + floor(L / 3)
	 * 출석 인정일 = 진행된 수업일 - 최종 결석 수
	 */
	private int fillAbsentCounts(StudentAttendanceVO student, int passedClassDays) {
		int recorded = student.getPresentCount() + student.getLateCount() + student.getAbsentCount();
		int noRecordDays = Math.max(0, passedClassDays - recorded);
		int lateAbsent = student.getLateCount() / LATE_COUNT_PER_ABSENT;
		int totalAbsent = student.getAbsentCount() + noRecordDays + lateAbsent;
		int attended = Math.max(0, passedClassDays - totalAbsent);

		student.setNoRecordCount(noRecordDays);
		student.setLateAbsentCount(lateAbsent);
		student.setTotalAbsentCount(totalAbsent);
		student.setAttendedDays(attended);
		return attended;
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

	@Override
	public List<CourseVO> searchCourseList(SearchCourseVO searchCourseVO) {
		// 결과가 없으면 MyBatis가 빈 리스트를 반환한다.
		return this.courseDao.searchCourseList(searchCourseVO);
	}

	@Transactional
	@Override
	public String updateCourse(String courseId, ModifyCourseVO modifyCourseVO) {
		modifyCourseVO.setId(courseId);
		this.checkTimetableInPeriod(courseId, modifyCourseVO.getStartDate(), modifyCourseVO.getEndDated());

		// 삭제되지 않은 과정이 없으면 0 행이 수정된다.
		int updatedRow = this.courseDao.updateCourse(modifyCourseVO);
		if (updatedRow == 0) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_EXISTS);
		}
		return courseId;
	}

	/**
	 * 새 과정 기간 밖에 시간표가 있으면 수정하지 않는다 (시작일 · 종료일 칸에 날짜를 적어 알림).
	 * 기간 밖 시간표는 화면에서 헷갈리기만 하고, 기간을 줄이면 밀려난 날의 수업 정보가 조용히 사라지기 때문.
	 * (수업일 · 진행률 · 출석률은 과정 시작일 ~ 종료일의 평일로 계산하며 시간표는 보지 않는다)
	 * 기간을 늘리는 것은 영향이 없어 그대로 허용된다.
	 */
	private void checkTimetableInPeriod(String courseId, String startDate, String endDate) {
		List<String> outside = this.courseDao.selectTimetableDatesOutside(courseId, startDate, endDate);
		if (outside.isEmpty()) {
			return;
		}
		// yyyy-MM-dd 문자열은 사전순 비교가 날짜 비교와 같다
		List<String> before = outside.stream().filter(day -> day.compareTo(startDate) < 0).toList();
		List<String> after = outside.stream().filter(day -> day.compareTo(endDate) > 0).toList();

		Map<String, List<String>> validations = new LinkedHashMap<>();
		if (!before.isEmpty()) {
			validations.put("startDate", List.of("시작일보다 앞에 시간표가 있습니다: "
					+ DateListText.summarize(before) + ". 시간표를 먼저 다시 올려 주세요."));
		}
		if (!after.isEmpty()) {
			validations.put("endDated", List.of("종료일보다 뒤에 시간표가 있습니다: "
					+ DateListText.summarize(after) + ". 시간표를 먼저 다시 올려 주세요."));
		}
		throw new ValidationFailedException(validations);
	}

	@Transactional
	@Override
	public String deleteCourse(String courseId) {
		// 실제로 지우지 않고 DEL_YN = 'Y' 로 표시한다. 삭제되지 않은 과정이 없으면 0 행.
		int deletedRow = this.courseDao.deleteCourse(courseId);
		if (deletedRow == 0) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_EXISTS);
		}
		return courseId;
	}

}
