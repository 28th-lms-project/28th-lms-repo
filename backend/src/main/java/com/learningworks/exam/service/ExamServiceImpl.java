package com.learningworks.exam.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.course.service.CourseAccessChecker;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.exam.dao.ExamDao;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.request.RegistTestAnswersListVO;
import com.learningworks.exam.vo.request.RegistTestAnswersVO;
import com.learningworks.exam.vo.request.RegistTestSetVO;
import com.learningworks.exam.vo.response.ExamQuestionAnswerVO;
import com.learningworks.exam.vo.response.ExamQuestionListVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class ExamServiceImpl implements ExamService {

	private ExamDao examDao;

	/** 과정 단위 권한 확인: 시험 세트 · 채점은 이 과정의 강사 또는 관리자, 응시는 이 과정의 수강생 */
	private CourseAccessChecker courseAccess;

	/** 시험 상태 SHOW_YN 값: 공개(응시 가능) Y · 마감 N · 채점 완료 C(강사 확정, 학생에게 결과 공개, 채점 잠금) */
	static final String SHOW_CLOSED = "N";
	static final String SHOW_GRADE_DONE = "C";

	/** 시험 세트. 없는 세트면 EXAM_NOT_EXISTS */
	private RegistTestSetVO findTestSet(String testSetId) {
		if (testSetId == null || testSetId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		RegistTestSetVO testSet = this.examDao.selectExamsetById(testSetId);
		if (testSet == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		return testSet;
	}

	@Transactional
	@Override
	public RegistTestSetVO completeGrading(String testSetId) {
		RegistTestSetVO testSet = this.findTestSet(testSetId);
		this.courseAccess.requireTutorOrAdmin(testSet.getCourseId());
		if (SHOW_GRADE_DONE.equals(testSet.getShowYn())) {
			throw new LearningworksException(ErrorCode.EXAM_GRADE_DONE);
		}
		if (this.examDao.countPendingAnswers(testSetId) > 0) {
			throw new LearningworksException(ErrorCode.EXAM_GRADE_PENDING);
		}
		// 채점 완료 = 마감 + 확정: 더 이상 응시할 수 없고(Y 아님), 학생에게 결과가 공개된다
		this.examDao.updateTestSetShowYn(testSetId, SHOW_GRADE_DONE);
		return this.examDao.selectExamsetById(testSetId);
	}

	@Transactional
	@Override
	public RegistTestSetVO cancelGradeDone(String testSetId) {
		RegistTestSetVO testSet = this.findTestSet(testSetId);
		// 강사는 취소할 수 없음: 모든 과정 관리 권한(COURSE_ALL_MANAGE)이 있는 관리자만
		if (!this.courseAccess.canManageAll(AuthUtil.getLoginId())) {
			throw new LearningworksException(ErrorCode.COURSE_NOT_AUTHORIZED);
		}
		if (!SHOW_GRADE_DONE.equals(testSet.getShowYn())) {
			throw new LearningworksException(ErrorCode.EXAM_GRADE_NOT_DONE);
		}
		// 마감 상태로 되돌림 (다시 채점 · 공개 여부 변경 가능, 학생 결과 화면은 닫힘)
		this.examDao.updateTestSetShowYn(testSetId, SHOW_CLOSED);
		return this.examDao.selectExamsetById(testSetId);
	}

	/** 시험 세트의 과정 ID. 없는 세트면 EXAM_NOT_EXISTS */
	private String courseIdOfTestSet(String testSetId) {
		RegistTestSetVO testSet = this.examDao.selectExamsetById(testSetId);
		if (testSet == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		return testSet.getCourseId();
	}

	/** TESTS.ANSWER_TYPE 에 넣을 수 있는 값 (공통 코드 TEST_ANSWER_TYPE 의 ID) */
	private static final Set<String> QUESTION_ANSWER_TYPES = Set.of(
			"ANSWER_SELECT", "ANSWER_MULTIPLE", "ANSWER_WRITE", "ANSWER_CHECK", "ANSWER_CODE");

	/** 문제 유형이 공통 코드 값인지 확인 (한글 이름 등 옛 값은 받지 않음) */
	private void validateAnswerType(String answerType) {
		if (answerType == null || !QUESTION_ANSWER_TYPES.contains(answerType)) {
			throw ValidationFailedException.of("answerType", "문제 유형을 목록에서 선택해주세요.");
		}
	}

	private boolean isManuallyGraded(String answerType) {
		return "ANSWER_WRITE".equals(answerType) || "ANSWER_CODE".equals(answerType);
	}

	private void prepareQuestionAnswers(RegistExamQuestionVO request) {
		this.validateAnswerType(request.getAnswerType());
		boolean manuallyGraded = this.isManuallyGraded(request.getAnswerType());
		boolean oxQuestion = "ANSWER_CHECK".equals(request.getAnswerType());
		if (manuallyGraded || oxQuestion) {
			if (oxQuestion) {
				this.validateOxAnswer(request.getCorrectAnswer());
			} else {
				request.setCorrectAnswer(null);
			}
			request.setAnswerCount(null);
			request.setAnswerSheet1(null);
			request.setAnswerSheet2(null);
			request.setAnswerSheet3(null);
			request.setAnswerSheet4(null);
			request.setAnswerSheet5(null);
			return;
		}
		request.setCorrectAnswer(this.validateQuestionAnswers(request.getAnswerType(), request.getAnswerCount(), request.getCorrectAnswer(),
				request.getAnswerSheet1(), request.getAnswerSheet2(), request.getAnswerSheet3(),
				request.getAnswerSheet4(), request.getAnswerSheet5()));
	}

	private void prepareQuestionAnswers(ModifyExamQuestionVO request) {
		this.validateAnswerType(request.getAnswerType());
		boolean manuallyGraded = this.isManuallyGraded(request.getAnswerType());
		boolean oxQuestion = "ANSWER_CHECK".equals(request.getAnswerType());
		if (manuallyGraded || oxQuestion) {
			if (oxQuestion) {
				this.validateOxAnswer(request.getCorrectAnswer());
			} else {
				request.setCorrectAnswer(null);
			}
			request.setAnswerCount(null);
			request.setAnswerSheet1(null);
			request.setAnswerSheet2(null);
			request.setAnswerSheet3(null);
			request.setAnswerSheet4(null);
			request.setAnswerSheet5(null);
			return;
		}
		request.setCorrectAnswer(this.validateQuestionAnswers(request.getAnswerType(), request.getAnswerCount(), request.getCorrectAnswer(),
				request.getAnswerSheet1(), request.getAnswerSheet2(), request.getAnswerSheet3(),
				request.getAnswerSheet4(), request.getAnswerSheet5()));
	}

	private void validateOxAnswer(String correctAnswer) {
		if (!"O".equals(correctAnswer) && !"X".equals(correctAnswer)) {
			throw ValidationFailedException.of("correctAnswer", "정답을 O 또는 X로 선택해주세요.");
		}
	}

	private String validateQuestionAnswers(String answerType, Integer answerCount, String correctAnswerValue, String... answers) {

		if (answerCount == null || answerCount < 1 || answerCount > 5) {
			throw ValidationFailedException.of("answerCount", "보기는 1~5개 입력해주세요.");
		}

		// 오류 필드 이름은 요청 VO 와 같게 (answerSheet1~5) → 화면이 해당 보기 오류로 표시
		for (int i = 0; i < answers.length; i++) {
			boolean hasText = answers[i] != null && !answers[i].isBlank();
			String field = "answerSheet" + (i + 1);

			if (i < answerCount && !hasText) {
				throw ValidationFailedException.of(field, "보기 내용을 입력해주세요.");
			}

			if (i >= answerCount && hasText) {
				throw ValidationFailedException.of(field, "보기 개수보다 많은 보기가 있습니다.");
			}
		}

		if ("ANSWER_MULTIPLE".equals(answerType)) {
			return this.validateMultipleAnswers(answerCount, correctAnswerValue);
		}

		int correctAnswer;

		try {
			correctAnswer = Integer.parseInt(correctAnswerValue);
		} catch (NumberFormatException e) {
			throw ValidationFailedException.of("correctAnswer", "정답 보기를 하나 선택해주세요.");
		}

		if (correctAnswer < 1 || correctAnswer > answerCount) {
			throw ValidationFailedException.of("correctAnswer", "정답 보기를 하나 선택해주세요.");
		}
		return correctAnswerValue;
	}

	private String validateMultipleAnswers(int answerCount, String correctAnswerValue) {
		String message = "정답 보기를 2개 이상 선택해주세요.";
		if (correctAnswerValue == null) {
			throw ValidationFailedException.of("correctAnswer", message);
		}
		Set<Integer> correctAnswers = new TreeSet<>();
		for (String token : correctAnswerValue.split(",", -1)) {
			String number = token.trim();
			if (!number.matches("[1-5]")) {
				throw ValidationFailedException.of("correctAnswer", message);
			}
			int answer = Integer.parseInt(number);
			if (answer > answerCount || !correctAnswers.add(answer)) {
				throw ValidationFailedException.of("correctAnswer", message);
			}
		}
		if (correctAnswers.size() < 2) {
			throw ValidationFailedException.of("correctAnswer", message);
		}
		return correctAnswers.stream().map(String::valueOf).collect(Collectors.joining(","));
	}
	
	

	@Override
	public List<ExamSetVO> readAllExamInExamSet(String courseId, String userId) {
		// 과정 화면의 시험 탭: 이 과정의 강사 · 수강생 또는 관리자
		this.courseAccess.requireMember(courseId);
		List<ExamSetVO> examSet = this.examDao.selectAllExamInExamSet(courseId, userId);
		System.out.println("시험 세트 수" + examSet.size());

		return examSet;
	}

	@Transactional
	@Override
	public ExamQuestionVO createNewExam(RegistExamQuestionVO registExamQuestionVO, String userId) {
		if (registExamQuestionVO == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		this.prepareQuestionAnswers(registExamQuestionVO);
		// 환경 변수에 없는 과목이면 문제 은행 화면에 보이지 않으므로 등록하지 않음
		if (this.examDao.countTestSubject(registExamQuestionVO.getSubjectId()) == 0) {
			throw ValidationFailedException.of("subjectId", "시험 과목을 목록에서 선택해주세요.");
		}
		int insertCount = this.examDao.insertNewExam(registExamQuestionVO, userId);

		if (insertCount > 0) {
			System.out.println("문제가 등록되었습니다.");
			ExamQuestionVO question = this.examDao.selectQuestionById(registExamQuestionVO.getId());
			if (question == null) {
				throw new LearningworksException(ErrorCode.EXAM_FAILURE_CREATE);
			}
			return question;
		}
		throw new LearningworksException(ErrorCode.EXAM_FAILURE_CREATE);
	}

	@Transactional
	@Override
	public String deleteExamQuestion(String examId, String userId) {
		int deletedRows = this.examDao.deleteExamQuestion(examId, userId);
		if (deletedRows == 0) {
			System.out.println("시험 문제를 삭제하는데 실패했습니다.");
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}

		return examId;
	}

	@Transactional
	@Override
	public ExamQuestionVO updateExamQuestion(String examId, ModifyExamQuestionVO modifyExamQuestionVO, String userId) {
		if (examId == null || examId.isBlank() || modifyExamQuestionVO == null) {
            throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
        }
        ExamQuestionVO examQuestionVO = this.examDao.selectQuestionById(examId);

		if (examQuestionVO == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}

		this.prepareQuestionAnswers(modifyExamQuestionVO);

		int updatedRows = this.examDao.updateExamQuestion(examId, modifyExamQuestionVO, userId);

		if (updatedRows != 1) {
			throw new LearningworksException(ErrorCode.EXAM_FAILURE_UPDATE);
		}

		ExamQuestionVO updatedQuestion = this.examDao.selectQuestionById(examId);
		if (updatedQuestion == null) {
			throw new LearningworksException(ErrorCode.EXAM_FAILURE_UPDATE);
		}
		return updatedQuestion;
	}

	@Override
	public ExamQuestionListVO readAllExamQuestion(String subjectId) {
		List<ExamQuestionVO> questions = this.examDao.selectAllQuestions(subjectId);
		long questionCount = this.examDao.selectQuestionsCount(subjectId);

		ExamQuestionListVO result = new ExamQuestionListVO();
		result.setExamList(questions);
		result.setQuestionCount(questionCount);
		return result;
	}



	@Override
	public ExamQuestionVO readOneQuestionsById(String examId) {
		ExamQuestionVO question = this.examDao.selectQuestionById(examId);
		if (question == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		return question;
	}

	@Override
	@Transactional 
	public RegistTestSetVO makeNewTestSet(String courseId, RegistTestSetVO registTestSetVO) {
		this.courseAccess.requireTutorOrAdmin(courseId);
		int TestSetResult = this.examDao.makeNewTestSet(courseId,registTestSetVO);
		if (TestSetResult == 0 ) {
			throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
		}
		System.out.println(registTestSetVO.getId());
//		int TestSetTestsResult = this.examDao.makeNewTestSetTest(registTestSetVO.getId());
		for(RegistExamQuestionVO question : registTestSetVO.getQuesteions()) {
			int TestSetTestsResult = this.examDao.makeNewTestSetTest(registTestSetVO.getId(),question.getId());
			if(TestSetTestsResult == 0) {
				throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
			}
		}
		RegistTestSetVO exam = this.examDao.selectExamsetById(registTestSetVO.getId());
		return exam;
	}

	@Transactional
	@Override
	public RegistTestSetVO updateTestSetShowYn(String testSetId, String showYn) {
		if (testSetId == null || testSetId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		RegistTestSetVO testSet = this.findTestSet(testSetId);
		this.courseAccess.requireTutorOrAdmin(testSet.getCourseId());
		// 채점 완료된 시험은 다시 공개 · 마감으로 바꿀 수 없음 (취소는 관리자 cancelGradeDone)
		if (SHOW_GRADE_DONE.equals(testSet.getShowYn())) {
			throw new LearningworksException(ErrorCode.EXAM_GRADE_DONE);
		}
		int updatedRows = this.examDao.updateTestSetShowYn(testSetId, showYn);
		if (updatedRows != 1) {
			// 해당 ID의 시험 세트가 없음
			throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
		}
		return this.examDao.selectExamsetById(testSetId);
	}

	@Override
	@Transactional 
	public String deleteTestSet(String testSetId) {
		this.courseAccess.requireTutorOrAdmin(this.courseIdOfTestSet(testSetId));
		int result = this.examDao.deleteTestSet(testSetId);
		if(result == 0) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		return testSetId;
	}

	@Override
	public ExamQuestionListVO viewTestSetQuestions(String testSetId) {
		// 정답이 포함된 문제 목록이라 이 과정의 강사 또는 관리자만 (수강생은 viewTestSetQuestionsForTake)
		this.courseAccess.requireTutorOrAdmin(this.courseIdOfTestSet(testSetId));
		List<ExamQuestionVO> result = this.examDao.viewTestSetQuestions(testSetId);
		if(result == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		ExamQuestionListVO list = new ExamQuestionListVO();
		list.setExamList(result);
		return list;
	}

	@Override
	public ExamQuestionListVO viewTestSetQuestionsForTake(String testSetId, String userId) {
		// 답안 제출(createTestAnswerByTestSetId)과 같은 조건: 존재 · 공개(Y) · 아직 제출 안 함
		RegistTestSetVO testSet = this.examDao.selectExamsetById(testSetId);
		if (testSet == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		// 이 과정의 수강생만 응시 (공개된 시험이라도 다른 과정 사람은 볼 수 없음)
		this.courseAccess.requireStudent(testSet.getCourseId());
		if (!"Y".equals(testSet.getShowYn())) {
			throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
		}
		if (this.examDao.countSubmittedAnswers(testSetId, userId) > 0) {
			throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
		}

		ExamQuestionListVO list = new ExamQuestionListVO();
		list.setExamList(this.examDao.viewTestSetQuestionsForTake(testSetId));
		return list;
	}

	/** 채점 결과: 채점 중(주관식 · 코드작성) */
	private static final String GRADE_PENDING = "R";
	/** 채점 결과: 정답 */
	private static final String GRADE_CORRECT = "Y";
	/** 채점 결과: 오답 */
	private static final String GRADE_WRONG = "N";
	// 부분정답(H)은 강사가 수동 채점할 때 사용

	/**
	 * 제출 시 자동 채점(Y/N)하는 문제 유형 (코드 / 한글 이름).
	 * 여기에 없는 유형(주관식 · 코드작성 · 객관식-다항 등)은 모범 답안이 있어도 R(채점 중)로 저장한다.
	 */
	private static final List<String> AUTO_GRADED_ANSWER_TYPES = List.of(
			"ANSWER_SELECT", "객관식-단항",
			"ANSWER_CHECK", "O/X");

	@Transactional
	@Override
	public void createTestAnswerByTestSetId(String testSetId, String userId, RegistTestAnswersListVO answersVO) {
		List<RegistTestAnswersVO> answers = answersVO == null ? null : answersVO.getAnswersList();
		if (testSetId == null || testSetId.isBlank() || answers == null || answers.isEmpty()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}

		// 존재하고 공개(Y)된 시험만 응시 가능 (화면 차단과 별개로 서버에서 확인)
		RegistTestSetVO testSet = this.examDao.selectExamsetById(testSetId);
		if (testSet == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		// 이 과정의 수강생만 답안을 낼 수 있다 (이전에는 공개 여부만 봐서 아무 과정의 시험에 제출 가능했음)
		this.courseAccess.requireStudent(testSet.getCourseId());
		if (!"Y".equals(testSet.getShowYn())) {
			throw new LearningworksException(ErrorCode.GLOBAL_FORBIDDEN);
		}

		// 중복 제출 방지 (응시자 = 로그인 userId)
		if (this.examDao.countSubmittedAnswers(testSetId, userId) > 0) {
			throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
		}

		// 정답을 한 번에 조회해서 Map으로 (반복문 안에서 문제마다 SELECT 하지 않기 위함)
		Map<String, ExamQuestionVO> answerKeyMap = this.examDao.selectAnswerKeysByTestSetId(testSetId)
				.stream()
				.collect(Collectors.toMap(ExamQuestionVO::getId, question -> question));

		for (RegistTestAnswersVO answer : answers) {
			ExamQuestionVO question = answerKeyMap.get(answer.getTestId());
			if (question == null) {
				// 이 시험 세트에 없는 문제의 답안 → 잘못된(조작된) 요청
				throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
			}

			// 클라이언트가 보낸 값은 믿지 않고 서버 값으로 채운다
			answer.setTestSetId(testSetId);
			answer.setCourseStudentId(userId);
			answer.setIsCorrect(this.gradeAnswer(question, answer.getAnswer()));

			int insertedRows = this.examDao.insertTestAnswer(answer);
			if (insertedRows != 1) {
				throw new LearningworksException(ErrorCode.GLOBAL_SYSTEM_ERROR);
			}
		}
	}

	/**
	 * 답안 자동 채점.
	 * 객관식-단항 · O/X만 Y(정답) / N(오답)으로 자동 채점하고,
	 * 그 외(주관식 · 코드작성 · 객관식-다항)는 모범 답안이 있어도 항상 R(채점 중) → 강사가 수동 채점.
	 */
	private String gradeAnswer(ExamQuestionVO question, String answer) {
		// TESTS.ANSWER_TYPE 에 코드(ANSWER_SELECT)와 한글 이름(객관식-단항)이 섞여 있어 둘 다 확인한다
		String answerType = question.getAnswerType() == null ? "" : question.getAnswerType().trim();
		if (!AUTO_GRADED_ANSWER_TYPES.contains(answerType)) {
			return GRADE_PENDING;
		}
		if (answer == null || answer.isBlank() || question.getCorrectAnswer() == null) {
			return GRADE_WRONG;
		}
		boolean correct = answer.trim().equals(question.getCorrectAnswer().trim());
		return correct ? GRADE_CORRECT : GRADE_WRONG;
	}

	@Override
	public List<ExamQuestionAnswerVO> isCorrectSetByUserId(String testSetId, String userId) {
		// 학생 답안 조회(채점 화면): 이 과정의 강사 또는 관리자
		this.courseAccess.requireTutorOrAdmin(this.courseIdOfTestSet(testSetId));
		List<ExamQuestionAnswerVO> answerLsit = this.examDao.correctStudentAnswer(testSetId, userId);
		System.out.println(answerLsit);
		return answerLsit;
	}

	@Transactional
	@Override
	public String updateAnswerGrade(String answerId, String isCorrect) {
		if (answerId == null || answerId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		String courseId = this.examDao.selectCourseIdByAnswerId(answerId);
		if (courseId == null) {
			// 해당 ID의 답안이 없음
			throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
		}
		this.courseAccess.requireTutorOrAdmin(courseId);
		// 채점 완료된 시험의 답안은 채점 결과를 바꿀 수 없음
		if (SHOW_GRADE_DONE.equals(this.examDao.selectShowYnByAnswerId(answerId))) {
			throw new LearningworksException(ErrorCode.EXAM_GRADE_DONE);
		}
		int updatedRows = this.examDao.updateAnswerGrade(answerId, isCorrect);
		if (updatedRows != 1) {
			// 해당 ID의 답안이 없음
			throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
		}
		return answerId;
	}

//	@Override
//	public ExamSetVO readExamSetByCourseName(String courseName) {
//		String testSetId = this.examDao.getTestSetIdByCourseName(courseName);
//		return null;
//	}

}
