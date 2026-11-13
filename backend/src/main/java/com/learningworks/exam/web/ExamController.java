package com.learningworks.exam.web;

import java.util.List;


import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.security.core.Authentication;

import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.exam.service.ExamService;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.ModifyTestSetShowYnVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.request.RegistTestAnswersListVO;
import com.learningworks.exam.vo.request.RegistTestAnswersVO;
import com.learningworks.exam.vo.response.ExamQuestionAnswerVO;
import com.learningworks.exam.vo.response.ExamQuestionListVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;
import com.learningworks.exam.vo.request.RegistTestSetVO;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

@AllArgsConstructor
@RestController
public class ExamController {
	private ExamService examService;

	@PostMapping("admin/system/test")
	public ApiResponse<ExamQuestionVO> makeNewQuestion(
			@Valid @RequestBody RegistExamQuestionVO registExamQuestionVO) {
		ExamQuestionVO examQuestion = this.examService.createNewExam(registExamQuestionVO);
		return ApiResponse.CREATED(examQuestion);
	}

	@GetMapping("admin/system/{courseId}/testSet")
	public ApiResponse<List<ExamSetVO>> getAllExamInExamSet(@PathVariable String courseId) {
		return ApiResponse.OK(this.examService.readAllExamInExamSet(courseId));
	}
	
	@GetMapping("admin/system/tests/{subjectId}")
	public ApiResponse<ExamQuestionListVO> getAllExamQuestion(@PathVariable String subjectId){
		return ApiResponse.OK(this.examService.readAllExamQuestion(subjectId));
	}
	
	@GetMapping("admin/system/test/{examId}")
	public ApiResponse<ExamQuestionVO> getOneQuestionById(@PathVariable String examId) {
		return ApiResponse.OK(this.examService.readOneQuestionsById(examId));
	}
	
	@DeleteMapping("admin/system/test/{examId}")
	public ApiResponse<String> deleteExamQuestion(@PathVariable String examId) {
		String deleteResult = this.examService.deleteExamQuestion(examId);
		return ApiResponse.OK(deleteResult);
	}


	@PutMapping("admin/system/test/{examId}")
	public ApiResponse<ExamQuestionVO> updateExamQuestion(@PathVariable String examId, @Valid @RequestBody ModifyExamQuestionVO modifyExamQuestionVO) {
		ExamQuestionVO examQuestionVO = this.examService.updateExamQuestion(examId, modifyExamQuestionVO);
		return ApiResponse.OK(examQuestionVO);
	}
	
	
	
	
	/**
	 * 
	 * 
	 * 아래 부터 수강과정 시험에 필요한 엔드포인트들 
	 * 
	 * 
	 * 
	 * 
	 */
	
	
	@PostMapping("admin/system/{courseId}/test/addTestSet")
	public ApiResponse<RegistTestSetVO> makeNewTestSet(@PathVariable String courseId,
													 @RequestBody RegistTestSetVO registTestSetVO){
		System.out.println(registTestSetVO);
		return ApiResponse.CREATED(this.examService.makeNewTestSet(courseId,registTestSetVO));
	}

	/** 시험 세트 공개 여부 수정. body: { "showYn": "Y" | "N" } */
	@PutMapping("admin/system/testSet/{testSetId}/showYn")
	public ApiResponse<RegistTestSetVO> updateTestSetShowYn(@PathVariable String testSetId,
			@Valid @RequestBody ModifyTestSetShowYnVO modifyTestSetShowYnVO) {
		return ApiResponse.OK(
				this.examService.updateTestSetShowYn(testSetId, modifyTestSetShowYnVO.getShowYn()));
	}
	
	@DeleteMapping("admin/system/testSet/{testSetId}")
	public ApiResponse<String> deleteTestSet(@PathVariable String testSetId){
		String result = this.examService.deleteTestSet(testSetId);
		return ApiResponse.OK(result);
	}
	
	@GetMapping("admin/system/{testSetId}/questionlist")
	public ApiResponse<ExamQuestionListVO> viewTestSetQuestions (@PathVariable String testSetId){
		ExamQuestionListVO questionList = this.examService.viewTestSetQuestions(testSetId);
		return ApiResponse.OK(questionList);
	}
	
	/**
	 * 시험 답안 제출.
	 * 권한 코드 EXAM_SUBMIT: SUPER_ADMIN은 항상 허용, 수강생(ROLE_STUDENT)은 권한 관리 화면에서 부여해야 한다.
	 * 응시자 ID는 요청 body가 아니라 로그인 정보(JWT)에서 꺼낸다.
	 */
	@RequireAction(domain = "EXAM", action = "SUBMIT", description = "시험 답안 제출")
	@PostMapping("my/test/{testSetId}")
	public ApiResponse<String> createTestAnswerByTestSetId(@PathVariable String testSetId,
													@RequestBody RegistTestAnswersListVO answersVO,
													Authentication authentication){
		String userId = authentication.getName();
		this.examService.createTestAnswerByTestSetId(testSetId, userId, answersVO);
		return ApiResponse.OK("제출완료");
	}
	
	@GetMapping("admin/{testSetId}/correct")
	public ApiResponse<List<ExamQuestionAnswerVO>> isCorrectSetByUserId(@PathVariable String testSetId){
		List<ExamQuestionAnswerVO> answerList = this.examService.isCorrectSetByUserId(testSetId);
		return ApiResponse.OK(answerList);
	}
	
}
