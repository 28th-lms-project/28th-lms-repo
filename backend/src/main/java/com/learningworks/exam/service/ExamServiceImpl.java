package com.learningworks.exam.service;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.exam.dao.ExamDao;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.request.RegistTestAnswersListVO;
import com.learningworks.exam.vo.request.RegistTestAnswersVO;
import com.learningworks.exam.vo.request.RegistTestSetVO;
import com.learningworks.exam.vo.response.ExamQuestionListVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;

import lombok.AllArgsConstructor;

@AllArgsConstructor
@Service
public class ExamServiceImpl implements ExamService {

	private ExamDao examDao;

	private boolean isManuallyGraded(String answerType) {
		return "주관식".equals(answerType) || "코드작성".equals(answerType);
	}

	private void prepareQuestionAnswers(RegistExamQuestionVO request) {
		boolean manuallyGraded = this.isManuallyGraded(request.getAnswerType());
		boolean oxQuestion = "O/X".equals(request.getAnswerType());
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
		boolean manuallyGraded = this.isManuallyGraded(request.getAnswerType());
		boolean oxQuestion = "O/X".equals(request.getAnswerType());
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
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
	}

	private String validateQuestionAnswers(String answerType, Integer answerCount, String correctAnswerValue, String... answers) {

		if (answerCount == null || answerCount < 1 || answerCount > 5) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}

		for (int i = 0; i < answers.length; i++) {
			boolean hasText = answers[i] != null && !answers[i].isBlank();

			if (i < answerCount && !hasText) {
				throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
			}

			if (i >= answerCount && hasText) {
				throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
			}
		}

		if ("객관식-다항".equals(answerType)) {
			return this.validateMultipleAnswers(answerCount, correctAnswerValue);
		}

		int correctAnswer;

		try {
			correctAnswer = Integer.parseInt(correctAnswerValue);
		} catch (NumberFormatException e) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER, e);
		}

		if (correctAnswer < 1 || correctAnswer > answerCount) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		return correctAnswerValue;
	}

	private String validateMultipleAnswers(int answerCount, String correctAnswerValue) {
		if (correctAnswerValue == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		Set<Integer> correctAnswers = new TreeSet<>();
		for (String token : correctAnswerValue.split(",", -1)) {
			String number = token.trim();
			if (!number.matches("[1-5]")) {
				throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
			}
			int answer = Integer.parseInt(number);
			if (answer > answerCount || !correctAnswers.add(answer)) {
				throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
			}
		}
		if (correctAnswers.size() < 2) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		return correctAnswers.stream().map(String::valueOf).collect(Collectors.joining(","));
	}
	
	

	@Override
	public List<ExamSetVO> readAllExamInExamSet(String courseId) {
		List<ExamSetVO> examSet = this.examDao.selectAllExamInExamSet(courseId);
		System.out.println("시험 세트 수" + examSet.size());

		return examSet;
	}

	@Transactional
	@Override
	public ExamQuestionVO createNewExam(RegistExamQuestionVO registExamQuestionVO) {
		if (registExamQuestionVO == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		this.prepareQuestionAnswers(registExamQuestionVO);
		int insertCount = this.examDao.insertNewExam(registExamQuestionVO);

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
	public String deleteExamQuestion(String examId) {
		int deletedRows = this.examDao.deleteExamQuestion(examId);
		if (deletedRows == 0) {
			System.out.println("시험 문제를 삭제하는데 실패했습니다.");
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}

		return examId;
	}

	@Transactional
	@Override
	public ExamQuestionVO updateExamQuestion(String examId, ModifyExamQuestionVO modifyExamQuestionVO) {
		if (examId == null || examId.isBlank() || modifyExamQuestionVO == null) {
            throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
        }
        ExamQuestionVO examQuestionVO = this.examDao.selectQuestionById(examId);

		if (examQuestionVO == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}

		this.prepareQuestionAnswers(modifyExamQuestionVO);

		int updatedRows = this.examDao.updateExamQuestion(examId, modifyExamQuestionVO);

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
	public RegistTestSetVO makeNewTestSet(String courseId, RegistTestSetVO registTestSetVO) {
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
		int updatedRows = this.examDao.updateTestSetShowYn(testSetId, showYn);
		if (updatedRows != 1) {
			// 해당 ID의 시험 세트가 없음
			throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
		}
		return this.examDao.selectExamsetById(testSetId);
	}

	@Override
	public String deleteTestSet(String testSetId) {
		int result = this.examDao.deleteTestSet(testSetId);
		if(result == 0) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		return testSetId;
	}

	@Override
	public ExamQuestionListVO viewTestSetQuestions(String testSetId) {
		List<ExamQuestionVO> result = this.examDao.viewTestSetQuestions(testSetId);
		if(result == null) {
			throw new LearningworksException(ErrorCode.EXAM_NOT_EXISTS);
		}
		ExamQuestionListVO list = new ExamQuestionListVO();
		list.setExamList(result);
		return list;
	}

	/** 채점 결과: 채점 중(주관식 · 코드작성) */
	private static final String GRADE_PENDING = "R";
	/** 채점 결과: 정답 */
	private static final String GRADE_CORRECT = "Y";
	/** 채점 결과: 오답 */
	private static final String GRADE_WRONG = "N";
	// 부분정답(H)은 강사가 수동 채점할 때 사용

	@Transactional
	@Override
	public void createTestAnswerByTestSetId(String testSetId, String userId, RegistTestAnswersListVO answersVO) {
		List<RegistTestAnswersVO> answers = answersVO == null ? null : answersVO.getAnswersList();
		if (testSetId == null || testSetId.isBlank() || answers == null || answers.isEmpty()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
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
	 * 주관식 · 코드작성은 항상 R(채점 중), 객관식 · O/X는 Y(정답) / N(오답).
	 */
	private String gradeAnswer(ExamQuestionVO question, String answer) {
		if (this.isManuallyGraded(question.getAnswerType())) {
			return GRADE_PENDING;
		}
		if (answer == null || answer.isBlank() || question.getCorrectAnswer() == null) {
			return GRADE_WRONG;
		}
		// 다항은 "3,1" 과 "1,3" 을 같은 답으로 보도록 정렬해서 비교
		boolean correct = "객관식-다항".equals(question.getAnswerType())
				? this.normalizeMultipleAnswer(answer).equals(this.normalizeMultipleAnswer(question.getCorrectAnswer()))
				: answer.trim().equals(question.getCorrectAnswer().trim());
		return correct ? GRADE_CORRECT : GRADE_WRONG;
	}

	/** "3, 1" → "1,3" */
	private String normalizeMultipleAnswer(String value) {
		return Arrays.stream(value.split(","))
				.map(String::trim)
				.filter(number -> !number.isEmpty())
				.sorted()
				.collect(Collectors.joining(","));
	}

//	@Override
//	public ExamSetVO readExamSetByCourseName(String courseName) {
//		String testSetId = this.examDao.getTestSetIdByCourseName(courseName);
//		return null;
//	}

}
