package com.learningworks.exam.web;

import java.util.List;


import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

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
	@ResponseBody
	public ExamQuestionVO makeNewQuestion(
			@RequestBody RegistExamQuestionVO registExamQuestionVO) {
		ExamQuestionVO examQuestion = this.examService.createNewExam(registExamQuestionVO);
		return examQuestion;
	}

	@GetMapping("admin/system/test")
	@ResponseBody
	public List<ExamSetVO> getAllExamSet() {
		return this.examService.readAllExamSet();
	}
	
	@DeleteMapping("admin/system/test/{examId}")
	@ResponseBody
	public String deleteExamQuestion(@PathVariable String examId) {
		String deleteResult = this.examService.deleteExamQuestion(examId);
		return deleteResult;
	}
	
//	@GetMapping("/test/{courseName}")
//	public ExamSetVO getExamSet(@PathVariable String courseName) {
//		ExamSetVO examSet = this.examService.readExamSetByCourseName(courseName);
//		return null;
//	}
	
	@PutMapping("admin/system/test/{examId}")
	@ResponseBody
	public ExamQuestionVO updateExamQuestion(@PathVariable String examId, ModifyExamQuestionVO modifyExamQuestionVO) {
		ExamQuestionVO examQuestionVO = this.examService.updateExamQuestion(examId, modifyExamQuestionVO);
		return examQuestionVO;
	}

}
