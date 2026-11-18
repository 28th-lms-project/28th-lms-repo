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

	/** 과정의 시험 세트 목록. userId 는 응시 여부(submittedYn) 계산용 로그인 사용자 */
	List<ExamSetVO> selectAllExamInExamSet(@Param("courseId") String courseId,
			@Param("userId") String userId);
	
	/** selectKey 로 만든 id 는 question.id 에 채워진다. userId 는 생성자 · 수정자 */
	int insertNewExam(@Param("question") RegistExamQuestionVO registExamQuestionVO,
			@Param("userId") String userId);

	ExamQuestionVO selectQuestionById(String id);

	/** 사용 중인 시험 과목(공통 코드 TEST_SUBJECT, USE_YN = 'Y')이면 1 */
	int countTestSubject(@Param("subjectId") String subjectId);


	int deleteExamQuestion(@Param("examId") String examId, @Param("userId") String userId);

	int updateExamQuestion(@Param("examId")String examId, @Param("modifyExamQuestionVO") ModifyExamQuestionVO modifyExamQuestionVO,
			@Param("userId") String userId);

	int makeNewTestSet(@Param("courseId")String courseId, @Param("RegistTestSetVO")RegistTestSetVO registTestSetVO);

	RegistTestSetVO selectExamsetById(String id);

	int makeNewTestSetTest(@Param("testSetId")String testSetId,@Param("questionId") String questionId);

	int updateTestSetShowYn(@Param("testSetId") String testSetId, @Param("showYn") String showYn);

	int deleteTestSet(String testSetId);

	List<ExamQuestionVO> viewTestSetQuestions(String testSetId);

	/** 응시용 문제 목록 (정답 CORRECT_ANSWER 제외) */
	List<ExamQuestionVO> viewTestSetQuestionsForTake(String testSetId);

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
