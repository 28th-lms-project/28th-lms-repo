package com.learningworks.survey.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.survey.dao.SurveyDao;
import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyListVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class SurveyServiceImpl implements SurveyService{
	private SurveyDao surveyDao;

	@Override
	@Transactional
	public SurveyVO createSurvey(@Valid RegistSurveyVO registSurvey) {
		if(registSurvey == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		int insertCount = this.surveyDao.insertNewSurvey(registSurvey);
		
		if(insertCount > 0) {
			System.out.println("설문이 등록되었습니다.");
			SurveyVO survey = this.surveyDao.selectSurveyById(registSurvey.getId());
			if(survey == null) {
				throw new LearningworksException(ErrorCode.SURVEY_FAILURE_CREATE);
			}
			return survey;
		}
		throw new LearningworksException(ErrorCode.SURVEY_FAILURE_CREATE);
	}

	@Override
	@Transactional
	public SurveyVO updateSurvey(ModifySurveyVO modifySurvey, String surveyId) {
		if (surveyId == null || surveyId.isBlank() || modifySurvey == null) {
            throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
        }
		SurveyVO survey = this.surveyDao.selectSurveyById(surveyId);
		
		if(survey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		
		int updateRows = this.surveyDao.updateSurvey(surveyId, modifySurvey);
		if(updateRows != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_FAILURE_UPDATE);
		}
		SurveyVO updateSurvey = this.surveyDao.selectSurveyById(surveyId);
		if(updateSurvey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		return updateSurvey;
	}

	@Override
	@Transactional
	public SurveyDataVO createSurveyData(@Valid RegistSurveyDataVO registSurveyDataVO, String surveyId) {
		
		if(registSurveyDataVO == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		int insertCount = this.surveyDao.insertNewSurveyData(surveyId , registSurveyDataVO);
		
		if(insertCount > 0) {
			System.out.println("설문 답변이 등록되었습니다.");
			SurveyDataVO surveyData = this.surveyDao.selectSurveyDataById(registSurveyDataVO.getId());
			if(surveyData == null) {
				throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_CREATE);
			}
			return surveyData;
		}
		throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_CREATE);
	}

	@Override
	@Transactional
	public SurveyVO updateSurveyData(@Valid ModifySurveyDataVO modifySurveyData, String surveyId, String surveyDataId) {
		if (surveyDataId == null || surveyDataId.isBlank() || surveyId == null || surveyId.isBlank()) {
            throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
        }
		SurveyDataVO surveyData = this.surveyDao.selectSurveyDataById(surveyDataId);
		
		if(surveyId == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		
		if(surveyData == null) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_NOT_EXISTS);
		}
		
		int updateRows = this.surveyDao.updateSurveyData(surveyDataId, modifySurveyData);
		if(updateRows != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_UPDATE);
		}
		SurveyVO updateSurveyData = this.surveyDao.selectSurveyById(surveyDataId);
		if(updateSurveyData == null) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_NOT_EXISTS);
		}
		return updateSurveyData;
	}

	@Override
	public SurveyListVO readAllSurveyByGroup(String group) {
		List<SurveyVO> surveies = this.surveyDao.selectAllSurveyByGroup(group);
		long surveyCount = this.surveyDao.selectSurveyCount(group);
		
		SurveyListVO surveyList = new SurveyListVO();
		surveyList.setSurveyList(surveies);
		surveyList.setCount(surveyCount);
		return surveyList;
	}

}
