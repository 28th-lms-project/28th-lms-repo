package com.learningworks.exam.service;

import java.util.List;
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

//	@Override
//	public ExamSetVO readExamSetByCourseName(String courseName) {
//		String testSetId = this.examDao.getTestSetIdByCourseName(courseName);
//		return null;
//	}

}
