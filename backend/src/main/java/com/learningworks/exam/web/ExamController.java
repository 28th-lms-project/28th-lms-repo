package com.learningworks.exam.web;

import java.util.List;


import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.learningworks.common.utils.ApiResponse;
import com.learningworks.exam.service.ExamService;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.response.ExamQuestionListVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import com.learningworks.exam.vo.response.ExamSetVO;

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

}
