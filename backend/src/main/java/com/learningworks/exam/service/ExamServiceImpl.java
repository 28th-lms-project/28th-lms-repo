package com.learningworks.exam.service;

import java.util.List;

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

	private void validateQuestionAnswers(ModifyExamQuestionVO request) {
		Integer answerCount = request.getAnswerCount();

		if (answerCount == null || answerCount < 1 || answerCount > 5) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}

		String[] answers = { request.getAnswerSheet1(), request.getAnswerSheet2(), request.getAnswerSheet3(),
				request.getAnswerSheet4(), request.getAnswerSheet5() };

		for (int i = 0; i < answers.length; i++) {
			boolean hasText = answers[i] != null && !answers[i].isBlank();

			if (i < answerCount && !hasText) {
				throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
			}

			if (i >= answerCount && hasText) {
				throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
			}
		}

		int correctAnswer;

		try {
			correctAnswer = Integer.parseInt(request.getCorrectAnswer());
		} catch (NumberFormatException e) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}

		if (correctAnswer < 1 || correctAnswer > answerCount) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
	}
	
	

	@Override
	public List<ExamSetVO> readAllExamInExamSet() {
		List<ExamSetVO> examSet = this.examDao.selectAllExamInExamSet();
		System.out.println("시험 세트 수" + examSet.size());

		return examSet;
	}

	@Transactional
	@Override
	public ExamQuestionVO createNewExam(RegistExamQuestionVO registExamQuestionVO) {
		int insertCount = this.examDao.insertNewExam(registExamQuestionVO);

		if (insertCount > 0) {
			System.out.println("문제가 등록되었습니다.");
			return this.examDao.selectQuestionById(registExamQuestionVO.getId());
		}
		throw new RuntimeException("문제 등록에 실패했습니다.");
	}

	@Transactional
	@Override
	public String deleteExamQuestion(String examId) {
		int deletedRows = this.examDao.deleteExamQuestion(examId);
		if (deletedRows == 0) {
			System.out.println("시험 문제를 삭제하는데 실패했습니다.");
			throw new RuntimeException("존재하지 않는 문제입니다.");
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
			throw new RuntimeException("존재하지 않는 문제입니다.");
		}

		this.validateQuestionAnswers(modifyExamQuestionVO);

		int updatedRows = this.examDao.updateExamQuestion(examId, modifyExamQuestionVO);

		if (updatedRows != 1) {
			throw new RuntimeException("문제 수정에 실패했습니다.");
		}

		return this.examDao.selectQuestionById(examId);
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
		return question;
	}

//	@Override
//	public ExamSetVO readExamSetByCourseName(String courseName) {
//		String testSetId = this.examDao.getTestSetIdByCourseName(courseName);
//		return null;
//	}

}
