package com.learningworks.survey.service;

import java.util.List;

import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyAnswerListVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.CourseSurveyQuestionVO;
import com.learningworks.survey.vo.response.CourseSurveyResultVO;
import com.learningworks.survey.vo.response.CourseSurveyStatisticsVO;
import com.learningworks.survey.vo.response.SurveyStudentAnswerVO;
import com.learningworks.survey.vo.response.CourseSurveyVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyListVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;

public interface SurveyService {

	SurveyVO createSurvey(@Valid RegistSurveyVO regisySurvey);

	SurveyVO updateSurvey(@Valid ModifySurveyVO modifySurvey, String surveyId);

	SurveyDataVO createSurveyData(@Valid RegistSurveyDataVO registSurveyDataVO, String surveyId);

	SurveyDataVO updateSurveyData(@Valid ModifySurveyDataVO modifySurveyData, String surveyId, String surveyDataId);

	SurveyListVO readAllSurveyByGroup(String group);

	String deleteSurvey(String surveyId);

	String deleteSurveyData(String surveyId, String surveyDataId);

	List<CourseSurveyVO> readAllCourseSurvey(String courseId);

	CourseSurveyVO createCourseSurvey(@Valid RegistCourseSurveyVO registCourseSurvey, String courseId);

	String deleteCourseSurvey(String courseId, String courseSurveyId);

	void createCourseSurveyAnswers(String courseId, String courseSurveyId, String userId,  @Valid RegistCourseSurveyAnswerListVO answer);

	boolean isAnswered(String courseId, String courseSurveyId, String userId);

	CourseSurveyQuestionVO readCourseSurveyQuestions(String courseId, String courseSurveyId, String userId);

	CourseSurveyResultVO readCourseSurveyResult(String courseId, String courseSurveyId);

	List<SurveyStudentAnswerVO> readCourseSurveyStudentAnswers(String courseId, String courseSurveyId,
			String courseStudentId);

	CourseSurveyStatisticsVO readCourseSurveyStatistics(String courseId, String courseSurveyId);

}
