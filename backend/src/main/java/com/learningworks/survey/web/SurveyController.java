package com.learningworks.survey.web;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.survey.service.SurveyService;
import com.learningworks.survey.vo.request.ModifySurveyDataVO;
import com.learningworks.survey.vo.request.ModifySurveyVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyAnswerListVO;
import com.learningworks.survey.vo.request.RegistCourseSurveyVO;
import com.learningworks.survey.vo.request.RegistSurveyDataVO;
import com.learningworks.survey.vo.request.RegistSurveyVO;
import com.learningworks.survey.vo.response.CourseSurveyQuestionVO;
import com.learningworks.survey.vo.response.CourseSurveyResultVO;
import com.learningworks.survey.vo.response.SurveyStudentAnswerVO;
import com.learningworks.survey.vo.response.CourseSurveyVO;
import com.learningworks.survey.vo.response.SurveyDataVO;
import com.learningworks.survey.vo.response.SurveyListVO;
import com.learningworks.survey.vo.response.SurveyVO;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
public class SurveyController {
	private SurveyService surveyService;

	@RequireAction(domain = "SURVEY", action = "READ", description = "설문 조회")
	@GetMapping("/admin/system/survey/{group}")
	public ApiResponse<SurveyListVO> getAllSurveybuGroup(@PathVariable String group) {
		SurveyListVO surveyList = this.surveyService.readAllSurveyByGroup(group);
		return ApiResponse.OK(surveyList);
	}

	@RequireAction(domain = "SURVEY", action = "CREATE", description = "설문 등록")
	@PostMapping("/admin/system/survey")
	public ApiResponse<SurveyVO> makeNewSurvey(@Valid @RequestBody RegistSurveyVO registSurvey) {
		SurveyVO survey = this.surveyService.createSurvey(registSurvey);
		return ApiResponse.CREATED(survey);
	}

	@RequireAction(domain = "SURVEY", action = "UPDATE", description = "설문 수정")
	@PutMapping("/admin/system/survey/{surveyId}")
	public ApiResponse<SurveyVO> updateSurvey(@Valid @RequestBody ModifySurveyVO modifySurvey,
			@PathVariable String surveyId) {
		SurveyVO survey = this.surveyService.updateSurvey(modifySurvey, surveyId);
		return ApiResponse.OK(survey);
	}

	@RequireAction(domain = "SURVEY", action = "DELETE", description = "설문 삭제")
	@DeleteMapping("/admin/system/survey/{surveyId}")
	public ApiResponse<String> deleteSurvey(@PathVariable String surveyId) {
		String survey = this.surveyService.deleteSurvey(surveyId);
		return ApiResponse.OK(survey);
	}

	@RequireAction(domain = "SURVEY", action = "CREATE", description = "설문 등록")
	@PostMapping("/admin/system/survey/{surveyId}/data")
	public ApiResponse<SurveyDataVO> makeNewSurveyData(@Valid @RequestBody RegistSurveyDataVO registSurveyDataVO,
			@PathVariable String surveyId) {
		SurveyDataVO surveyDataVO = this.surveyService.createSurveyData(registSurveyDataVO, surveyId);
		return ApiResponse.CREATED(surveyDataVO);
	}

	@RequireAction(domain = "SURVEY", action = "UPDATE", description = "설문 수정")
	@PutMapping("/admin/system/survey/{surveyId}/data/{surveyDataId}")
	public ApiResponse<SurveyDataVO> updateSurveyData(@Valid @RequestBody ModifySurveyDataVO modifySurveyData,
			@PathVariable String surveyId, @PathVariable String surveyDataId) {
		SurveyDataVO survey = this.surveyService.updateSurveyData(modifySurveyData, surveyId, surveyDataId);
		return ApiResponse.OK(survey);
	}
	
	@RequireAction(domain = "SURVEY", action = "DELETE", description = "설문 삭제")
	@DeleteMapping("/admin/system/survey/{surveyId}/data/{surveyDataId}")
	public ApiResponse<String> deleteSurveyData(@PathVariable String surveyId, @PathVariable String surveyDataId) {
		String survey = this.surveyService.deleteSurveyData(surveyId, surveyDataId);
		return ApiResponse.OK(survey);
	}
	
	@RequireAction(domain = "COURSE_SURVEY", action = "READ", description = "과정 설문 조회")
	@GetMapping("/survey/{courseId}")
	public ApiResponse<List<CourseSurveyVO>> getCourseSurvey(@PathVariable String courseId){
		List<CourseSurveyVO> survey = this.surveyService.readAllCourseSurvey(courseId);
		return ApiResponse.OK(survey);
	}
	
	@RequireAction(domain = "COURSE_SURVEY", action = "CREATE", description = "과정 설문 등록")
	@PostMapping("/survey/{courseId}")
	public ApiResponse<CourseSurveyVO> makeNewCourseSurvey(@PathVariable String courseId,
			@Valid @RequestBody RegistCourseSurveyVO registCourseSurvey) {
		return ApiResponse.CREATED(this.surveyService.createCourseSurvey(registCourseSurvey, courseId));
	}

	@RequireAction(domain = "COURSE_SURVEY", action = "DELETE", description = "과정 설문 삭제")
	@DeleteMapping("/survey/{courseId}/{courseSurveyId}")
	public ApiResponse<String> deleteCourseSurvey(@PathVariable String courseId,
			@PathVariable String courseSurveyId) {
		return ApiResponse.OK(this.surveyService.deleteCourseSurvey(courseId, courseSurveyId));
	}
	
	/** 설문 답변 팝업용: 과정 설문 정보 + 문항/보기 (이 과정의 수강생만) */
	@RequireAction(domain = "COURSE_SURVEY", action = "ANSWER", description = "과정 설문 응답")
	@GetMapping("/survey/{courseId}/{courseSurveyId}")
	public ApiResponse<CourseSurveyQuestionVO> getCourseSurveyQuestions(@PathVariable String courseId,
			@PathVariable String courseSurveyId, Authentication authentication) {
		CourseSurveyQuestionVO result = this.surveyService.readCourseSurveyQuestions(courseId, courseSurveyId,
				authentication.getName());
		return ApiResponse.OK(result);
	}

	@RequireAction(domain = "COURSE_SURVEY", action = "ANSWER", description = "과정 설문 응답")
	@PostMapping("/survey/{courseId}/{courseSurveyId}/response")
	public ApiResponse<String> createCourseSurveyAnswers(@PathVariable String courseId,
			@PathVariable String courseSurveyId, @Valid @RequestBody RegistCourseSurveyAnswerListVO answer,
			Authentication authentication){
		this.surveyService.createCourseSurveyAnswers(courseId, courseSurveyId, authentication.getName() ,answer);
		
		return ApiResponse.OK("답변 제출");
	}
	
	@RequireAction(domain = "COURSE_SURVEY", action = "ANSWER", description = "과정 설문 응답")
	@GetMapping("/survey/{courseId}/{courseSurveyId}/response")
	public ApiResponse<Boolean> getMySurveyAnswer(@PathVariable String courseId, @PathVariable String courseSurveyId
			, Authentication authentication){
		boolean answered = this.surveyService.isAnswered(courseId, courseSurveyId, authentication.getName());
		return ApiResponse.OK(answered);
	}

	/** 설문 결과 팝업: 과정 설문 정보 + 문항/보기 + 응답한 학생 목록 */
	@RequireAction(domain = "COURSE_SURVEY", action = "READ", description = "과정 설문 조회")
	@GetMapping("/survey/{courseId}/{courseSurveyId}/result")
	public ApiResponse<CourseSurveyResultVO> getCourseSurveyResult(@PathVariable String courseId,
			@PathVariable String courseSurveyId) {
		return ApiResponse.OK(this.surveyService.readCourseSurveyResult(courseId, courseSurveyId));
	}

	/** 설문 결과 팝업: 한 학생의 답변 */
	@RequireAction(domain = "COURSE_SURVEY", action = "READ", description = "과정 설문 조회")
	@GetMapping("/survey/{courseId}/{courseSurveyId}/result/{courseStudentId}")
	public ApiResponse<List<SurveyStudentAnswerVO>> getCourseSurveyStudentAnswers(@PathVariable String courseId,
			@PathVariable String courseSurveyId, @PathVariable String courseStudentId) {
		return ApiResponse.OK(
				this.surveyService.readCourseSurveyStudentAnswers(courseId, courseSurveyId, courseStudentId));
	}
}
