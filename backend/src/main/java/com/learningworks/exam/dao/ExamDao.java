package com.learningworks.exam.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;

@Mapper
public interface ExamDao {

	List<ExamQuestionVO> selectAllQuestions(@Param("subjectId") String subjectId);

	long selectQuestionsCount(@Param("subjectId") String subjectId);

	List<ExamSetVO> selectAllExamInExamSet(String courseId);
	
	int insertNewExam(RegistExamQuestionVO registExamQuestionVO);

	ExamQuestionVO selectQuestionById(String id);


	int deleteExamQuestion(String examId);

	int updateExamQuestion(@Param("examId")String examId, @Param("modifyExamQuestionVO") ModifyExamQuestionVO modifyExamQuestionVO);


//	String getTestSetIdByCourseName(String courseName);

}
