package com.learningworks.survey.web;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.utils.ApiResponse;
import com.learningworks.survey.service.SurveyService;
import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyListVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
public class SurveyController {
	private SurveyService surveyService;

	@GetMapping("/admin/system/survey/{group}")
	public ApiResponse<SurveyListVO> getAllSurveybuGroup(@PathVariable String group) {
		SurveyListVO surveyList = this.surveyService.readAllSurveyByGroup(group);
		return ApiResponse.OK(surveyList);
	}

	@PostMapping("/admin/system/survey")
	public ApiResponse<SurveyVO> makeNewSurvey(@Valid @RequestBody RegistSurveyVO registSurvey) {
		SurveyVO survey = this.surveyService.createSurvey(registSurvey);
		return ApiResponse.CREATED(survey);
	}

	@PutMapping("/admin/system/survey/{surveyId}")
	public ApiResponse<SurveyVO> updateSurvey(@Valid @RequestBody ModifySurveyVO modifySurvey,
			@PathVariable String surveyId) {
		SurveyVO survey = this.surveyService.updateSurvey(modifySurvey, surveyId);
		return ApiResponse.OK(survey);
	}

	@DeleteMapping("/admin/system/survey/{surveyId}")
	public ApiResponse<String> deleteSurvey(@PathVariable String surveyId) {
		String survey = this.surveyService.deleteSurvey(surveyId);
		return ApiResponse.OK(survey);
	}

	@PostMapping("/admin/system/survey/{surveyId}/data")
	public ApiResponse<SurveyDataVO> makeNewSurveyData(@Valid @RequestBody RegistSurveyDataVO registSurveyDataVO,
			@PathVariable String surveyId) {
		SurveyDataVO surveyDataVO = this.surveyService.createSurveyData(registSurveyDataVO, surveyId);
		return ApiResponse.CREATED(surveyDataVO);
	}

	@PutMapping("/admin/system/survey/{surveyId}/data/{surveyDataId}")
	public ApiResponse<SurveyDataVO> updateSurveyData(@Valid @RequestBody ModifySurveyDataVO modifySurveyData,
			@PathVariable String surveyId, @PathVariable String surveyDataId) {
		SurveyDataVO survey = this.surveyService.updateSurveyData(modifySurveyData, surveyId, surveyDataId);
		return ApiResponse.OK(survey);
	}
	
	@DeleteMapping("/admin/system/survey/{surveyId}/data/{surveyDataId}")
	public ApiResponse<String> deleteSurveyData(@PathVariable String surveyId, @PathVariable String surveyDataId) {
		String survey = this.surveyService.deleteSurveyData(surveyId, surveyDataId);
		return ApiResponse.OK(survey);
	}

}
