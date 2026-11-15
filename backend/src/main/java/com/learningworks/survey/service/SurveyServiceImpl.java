package com.learningworks.survey.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.survey.dao.SurveyDao;
import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyAnswerListVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.CourseSurveyVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyListVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class SurveyServiceImpl implements SurveyService {
	private SurveyDao surveyDao;

	@Override
	@Transactional
	public SurveyVO createSurvey(@Valid RegistSurveyVO registSurvey) {
		if (registSurvey == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		int insertCount = this.surveyDao.insertNewSurvey(registSurvey);

		if (insertCount > 0) {
			System.out.println("설문이 등록되었습니다.");
			SurveyVO survey = this.surveyDao.selectSurveyById(registSurvey.getId());
			if (survey == null) {
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

		if (survey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}

		int updateRows = this.surveyDao.updateSurvey(surveyId, modifySurvey);
		if (updateRows != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_FAILURE_UPDATE);
		}
		
		if("text".equals(modifySurvey.getType())) {
			this.surveyDao.deleteSurveyDatas(surveyId);
		}
		
		SurveyVO updateSurvey = this.surveyDao.selectSurveyById(surveyId);
		if (updateSurvey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		return updateSurvey;
	}

	@Override
	@Transactional
	public SurveyDataVO createSurveyData(@Valid RegistSurveyDataVO registSurveyDataVO, String surveyId) {

		if (registSurveyDataVO == null) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		
		SurveyVO survey = this.surveyDao.selectSurveyById(surveyId);
		
		
		int insertCount = this.surveyDao.insertNewSurveyData(surveyId, registSurveyDataVO);

		if (insertCount > 0) {
			System.out.println("설문 답변이 등록되었습니다.");
			SurveyDataVO surveyData = this.surveyDao.selectSurveyDataById(registSurveyDataVO.getId());
			if (surveyData == null) {
				throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_CREATE);
			}
			return surveyData;
		}
		throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_CREATE);
	}

	@Override
	@Transactional
	public SurveyDataVO updateSurveyData(@Valid ModifySurveyDataVO modifySurveyData, String surveyId,
			String surveyDataId) {
		if (surveyDataId == null || surveyDataId.isBlank() || surveyId == null || surveyId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		SurveyDataVO surveyData = this.surveyDao.selectSurveyDataById(surveyDataId);

		if (surveyId == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}

		if (surveyData == null) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_NOT_EXISTS);
		}

		int updateRows = this.surveyDao.updateSurveyData(surveyDataId, modifySurveyData);
		if (updateRows != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_DATA_FAILURE_UPDATE);
		}
		SurveyDataVO updateSurveyData = this.surveyDao.selectSurveyDataById(surveyDataId);
		if (updateSurveyData == null) {
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

	@Override
	@Transactional
	public String deleteSurvey(String surveyId) {
		this.surveyDao.deleteSurveyDatas(surveyId);
		int deletedRows = this.surveyDao.deleteOneSurvey(surveyId);
		if (deletedRows == 0) {
			System.out.println("설문 문항을 삭제하는데 실패했습니다.");
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}

		return surveyId;
	}

	@Override
	@Transactional
	public String deleteSurveyData(String surveyId, String surveyDataId) {
		int deleteRow = this.surveyDao.deleteOneSurveyData(surveyId, surveyDataId);

		return surveyDataId;
	}

	@Override
	public List<CourseSurveyVO> readAllCourseSurvey(String courseId) {
		return this.surveyDao.selectAllCourseSurvey(courseId);
	}

	@Override
	@Transactional
	public CourseSurveyVO createCourseSurvey(@Valid RegistCourseSurveyVO registCourseSurvey, String courseId) {
		if(registCourseSurvey == null || courseId == null || courseId.isBlank()) {
			throw new LearningworksException(ErrorCode.GLOBAL_INVALID_PARAMETER);
		}
		registCourseSurvey.setCourseId(courseId);
		
		int insertCount = this.surveyDao.insertNewCourseSurvey(registCourseSurvey);
		if(insertCount != 1) {
			throw new LearningworksException(ErrorCode.SURVEY_FAILURE_CREATE);
		}
		CourseSurveyVO courseSurvey = this.surveyDao.selectCourseSurvey(registCourseSurvey.getId());
		if(courseSurvey == null) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		
		return courseSurvey;
	}

	@Override
	@Transactional
	public String deleteCourseSurvey(String courseId, String courseSurveyId) {
		// 답변 상세 → 답변 → 설문 순서로 삭제
		this.surveyDao.deleteCourseSurveyAnswerDatas(courseSurveyId);
		this.surveyDao.deleteCourseSurveyAnswers(courseSurveyId);

		int deletedRows = this.surveyDao.deleteOneCourseSurvey(courseId, courseSurveyId);
		if (deletedRows == 0) {
			throw new LearningworksException(ErrorCode.SURVEY_NOT_EXISTS);
		}
		return courseSurveyId;
	}

	@Override
	@Transactional
	public void createCourseSurveyAnswers(String courseId, String courseSurveyId, String userId,
			@Valid RegistCourseSurveyAnswerListVO answer) {
		
		//TODO 설문 답변 등록 구현 필요
		
	}

	
	
	
}
