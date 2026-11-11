package com.learningworks.exam.service;

import java.util.List;

import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
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

//	ExamSetVO readExamSetByCourseName(String courseName);

}
