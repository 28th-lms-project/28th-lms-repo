package com.learningworks.exam.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.request.RegistTestAnswersVO;
import com.learningworks.exam.vo.request.RegistTestSetVO;
import com.learningworks.exam.vo.response.ExamQuestionAnswerVO;
import com.learningworks.exam.vo.response.ExamQuestionListVO;
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

	int makeNewTestSet(@Param("courseId")String courseId, @Param("RegistTestSetVO")RegistTestSetVO registTestSetVO);

	RegistTestSetVO selectExamsetById(String id);

	int makeNewTestSetTest(@Param("testSetId")String testSetId,@Param("questionId") String questionId);

	int updateTestSetShowYn(@Param("testSetId") String testSetId, @Param("showYn") String showYn);

	int deleteTestSet(String testSetId);

	List<ExamQuestionVO> viewTestSetQuestions(String testSetId);

	/** 시험 세트 문제들의 정답 · 유형 (채점용, 한 번에 조회) */
	List<ExamQuestionVO> selectAnswerKeysByTestSetId(String testSetId);

	/** 이미 제출한 답안 수 (중복 제출 확인) */
	int countSubmittedAnswers(@Param("testSetId") String testSetId,
			@Param("courseStudentId") String courseStudentId);

	/** 답안 1건 저장. 파라미터가 VO 하나라 selectKey 로 만든 id 가 VO 에 채워진다 */
	int insertTestAnswer(RegistTestAnswersVO registTestAnswersVO);

	List<ExamQuestionAnswerVO> correctStudentAnswer(@Param("testSetId")String testSetId,@Param("userId") String userId);

	/** 답안 1건의 채점 결과(IS_CORRECT) 수정 */
	int updateAnswerGrade(@Param("answerId") String answerId, @Param("isCorrect") String isCorrect);


//	String getTestSetIdByCourseName(String courseName);

}
