package com.learningworks.survey.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;

@Mapper
public interface SurveyDao {

	int insertNewSurvey(@Valid RegistSurveyVO registSurvey);
	
	int insertNewSurveyData(@Param("surveyId") String surveyId,@Param("registSurveyDataVO") RegistSurveyDataVO registSurveyDataVO);

	SurveyVO selectSurveyById(String id);

	int updateSurvey(@Param("surveyId") String surveyId, @Param("modifySurvey") ModifySurveyVO modifySurvey);

	SurveyDataVO selectSurveyDataById(String id);

	int updateSurveyData(String surveyDataId, @Valid ModifySurveyDataVO modifySurveyData);

	List<SurveyVO> selectAllSurveyByGroup(String group);

	long selectSurveyCount(String group);

}
