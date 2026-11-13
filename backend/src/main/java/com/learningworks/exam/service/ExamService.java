package com.learningworks.exam.service;

import java.util.List;

import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.request.RegistTestAnswersListVO;
import com.learningworks.exam.vo.request.RegistTestSetVO;
import com.learningworks.exam.vo.response.ExamQuestionAnswerVO;
import com.learningworks.exam.vo.response.ExamQuestionListVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;

public interface ExamService {

	List<ExamSetVO> readAllExamInExamSet(String courseId);

	ExamQuestionVO createNewExam(RegistExamQuestionVO registExamQuestionVO);

	String deleteExamQuestion(String examId);

	ExamQuestionVO updateExamQuestion(String examId, ModifyExamQuestionVO modifyExamQuestionVO);

	ExamQuestionListVO readAllExamQuestion(String subjectId);

	ExamQuestionVO readOneQuestionsById(String examId);

	RegistTestSetVO makeNewTestSet(String courseId, RegistTestSetVO registTestSetVO);

	RegistTestSetVO updateTestSetShowYn(String testSetId, String showYn);

	String deleteTestSet(String testSetId);

	ExamQuestionListVO viewTestSetQuestions(String testSetId);

	/**
	 * @param testSetId 시험 세트 ID
	 * @param userId 응시자(로그인 사용자) ID
	 * @param answersVO 제출 답안 목록
	 */
	void createTestAnswerByTestSetId(String testSetId, String userId, RegistTestAnswersListVO answersVO);

	List<ExamQuestionAnswerVO> isCorrectSetByUserId(String testSetId, String userId);

	/**
	 * 답안 1건의 채점 결과 수정.
	 * @param answerId 답안 ID (TN-...)
	 * @param isCorrect Y: 정답, N: 오답, H: 부분정답
	 * @return 수정한 답안 ID
	 */
	String updateAnswerGrade(String answerId, String isCorrect);

//	ExamSetVO readExamSetByCourseName(String courseName);

}
