package com.learningworks.exam.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;

@Mapper
public interface ExamDao {

	List<ExamQuestionVO> selectAllQuestions();

	long selectQuestionsCount();
	

	List<ExamSetVO> selectAllExamSet();

	int insertNewExam(RegistExamQuestionVO registExamQuestionVO);

	ExamQuestionVO selectQuestionById(String id);


	int deleteExamQuestion(String examId);

	int updateExamQuestion(String examId, ModifyExamQuestionVO modifyExamQuestionVO);


//	String getTestSetIdByCourseName(String courseName);

}
