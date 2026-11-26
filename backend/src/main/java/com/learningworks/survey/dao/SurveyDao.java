package com.learningworks.survey.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyAnswerVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.CourseSurveyVO;
import com.learningworks.survey.vo.response.SurveyCountVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyRespondentVO;
import com.learningworks.survey.vo.response.SurveyStudentAnswerVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;

@Mapper
public interface SurveyDao {

	int insertNewSurvey(@Valid RegistSurveyVO registSurvey);
	
	int insertNewSurveyData(@Param("surveyId") String surveyId,@Param("registSurveyDataVO") RegistSurveyDataVO registSurveyDataVO);

	SurveyVO selectSurveyById(String id);

	int updateSurvey(@Param("surveyId") String surveyId, @Param("modifySurvey") ModifySurveyVO modifySurvey);

	SurveyDataVO selectSurveyDataById(String id);

	int updateSurveyData(@Param("surveyDataId") String surveyDataId, @Param("modifySurveyData") @Valid ModifySurveyDataVO modifySurveyData);

	List<SurveyVO> selectAllSurveyByGroup(String group);

	long selectSurveyCount(String group);

	int deleteOneSurvey(String surveyId);

	int deleteOneSurveyData(@Param("surveyId") String surveyId, @Param("surveyDataId") String surveyDataId);
	
	int deleteSurveyDatas(String surveyId);

	/** userId: 로그인 사용자 (answeredYn 계산용) */
	List<CourseSurveyVO> selectAllCourseSurvey(@Param("courseId") String courseId,
			@Param("userId") String userId);

	int insertNewCourseSurvey(RegistCourseSurveyVO registCourseSurvey);

	CourseSurveyVO selectCourseSurvey(String id);

	int deleteCourseSurveyAnswerDatas(String courseSurveyId);

	int deleteCourseSurveyAnswers(String courseSurveyId);

	int deleteOneCourseSurvey(@Param("courseId") String courseId,@Param("courseSurveyId") String courseSurveyId);

	String selectCourseStudentId(@Param("courseId") String courseId, @Param("userId") String userId);

	int selectCourseSurveyAnswerCount(@Param("courseSurveyId") String courseSurveyId, @Param("courseStudentId") String courseStudentId);

	int insertNewCourseSurveyAnswer(@Param("courseSurveyId") String courseSurveyId, @Param("courseStudentId") String courseStudentId, @Param("answer") RegistCourseSurveyAnswerVO answer);

	void insertNewCourseSurveyAnswerData(@Param("answerId") String answerId, @Param("dataId") String dataId, @Param("textAnswer") String textAnswer);

	List<SurveyRespondentVO> selectCourseSurveyRespondents(String courseSurveyId);

	/** 응답자 ID(COURSE_SURVEY_ANSWER.ID) → 과정 수강생 ID. 이 설문의 응답이 아니면 null */
	String selectRespondentCourseStudentId(@Param("courseSurveyId") String courseSurveyId,
			@Param("respondentId") String respondentId);

	List<SurveyStudentAnswerVO> selectCourseSurveyStudentAnswers(@Param("courseSurveyId") String courseSurveyId,
			@Param("courseStudentId") String courseStudentId);

	List<SurveyCountVO> selectCourseSurveyOptionsCounts(String courseSurveyId);

	List<SurveyCountVO> selectCourseSurveyQuestionCount(String courseSurveyId);

	List<SurveyStudentAnswerVO> selectCourseSurveyTextAnswers(String courseSurveyId);

	int selectCourseSurveyResponseCount(String courseSurveyId);

	int selectCourseStudentCount(String courseId);
	
	

}
