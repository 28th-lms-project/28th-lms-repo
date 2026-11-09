package com.learningworks.survey.service;

import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyListVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;

public interface SurveyService {

	SurveyVO createSurvey(@Valid RegistSurveyVO regisySurvey);

	SurveyVO updateSurvey(@Valid ModifySurveyVO modifySurvey, String surveyId);

	SurveyDataVO createSurveyData(@Valid RegistSurveyDataVO registSurveyDataVO, String surveyId);

	SurveyVO updateSurveyData(@Valid ModifySurveyDataVO modifySurveyData, String surveyId, String surveyDataId);

	SurveyListVO readAllSurveyByGroup(String group);

}
