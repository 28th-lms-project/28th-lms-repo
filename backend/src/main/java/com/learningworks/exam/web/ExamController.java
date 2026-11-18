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
import com.learningworks.exam.vo.request.ModifyAnswerGradeVO;
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

	@RequireAction(domain = "EXAM", action = "QUESTION_CREATE", description = "시험 문제 등록")
	@PostMapping("admin/system/test")
	public ApiResponse<ExamQuestionVO> makeNewQuestion(
			@Valid @RequestBody RegistExamQuestionVO registExamQuestionVO,
			Authentication authentication) {
		ExamQuestionVO examQuestion = this.examService.createNewExam(registExamQuestionVO,
				authentication.getName());
		return ApiResponse.CREATED(examQuestion);
	}

	@RequireAction(domain = "EXAM", action = "SET_READ", description = "시험 세트 조회")
	@GetMapping("admin/system/{courseId}/testSet")
	public ApiResponse<List<ExamSetVO>> getAllExamInExamSet(@PathVariable String courseId,
															Authentication authentication) {
		// 응시 여부(submittedYn)는 로그인 사용자 기준 (답안 제출의 중복 검사와 같은 조건)
		String userId = authentication.getName();
		return ApiResponse.OK(this.examService.readAllExamInExamSet(courseId, userId));
	}
	
	@RequireAction(domain = "EXAM", action = "QUESTION_READ", description = "시험 문제 조회")
	@GetMapping("admin/system/tests/{subjectId}")
	public ApiResponse<ExamQuestionListVO> getAllExamQuestion(@PathVariable String subjectId){
		return ApiResponse.OK(this.examService.readAllExamQuestion(subjectId));
	}
	
	@RequireAction(domain = "EXAM", action = "QUESTION_READ", description = "시험 문제 조회")
	@GetMapping("admin/system/test/{examId}")
	public ApiResponse<ExamQuestionVO> getOneQuestionById(@PathVariable String examId) {
		return ApiResponse.OK(this.examService.readOneQuestionsById(examId));
	}
	
	@RequireAction(domain = "EXAM", action = "QUESTION_DELETE", description = "시험 문제 삭제")
	@DeleteMapping("admin/system/test/{examId}")
	public ApiResponse<String> deleteExamQuestion(@PathVariable String examId,
			Authentication authentication) {
		String deleteResult = this.examService.deleteExamQuestion(examId, authentication.getName());
		return ApiResponse.OK(deleteResult);
	}


	@RequireAction(domain = "EXAM", action = "QUESTION_UPDATE", description = "시험 문제 수정")
	@PutMapping("admin/system/test/{examId}")
	public ApiResponse<ExamQuestionVO> updateExamQuestion(@PathVariable String examId,
			@Valid @RequestBody ModifyExamQuestionVO modifyExamQuestionVO,
			Authentication authentication) {
		ExamQuestionVO examQuestionVO = this.examService.updateExamQuestion(examId, modifyExamQuestionVO,
				authentication.getName());
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
	
	
	@RequireAction(domain = "EXAM", action = "COURSE_SET_CREATE", description = "시험 세트 등록")
	@PostMapping("admin/system/{courseId}/test/addTestSet")
	public ApiResponse<RegistTestSetVO> makeNewTestSet(@PathVariable String courseId,
													 @RequestBody RegistTestSetVO registTestSetVO){
		System.out.println(registTestSetVO);
		return ApiResponse.CREATED(this.examService.makeNewTestSet(courseId,registTestSetVO));
	}

	/** 시험 세트 공개 여부 수정. body: { "showYn": "Y" | "N" } */
	@RequireAction(domain = "EXAM", action = "COURSE_SET_UPDATE", description = "시험 세트 수정")
	@PutMapping("admin/system/testSet/{testSetId}/showYn")
	public ApiResponse<RegistTestSetVO> updateTestSetShowYn(@PathVariable String testSetId,
			@Valid @RequestBody ModifyTestSetShowYnVO modifyTestSetShowYnVO) {
		return ApiResponse.OK(
				this.examService.updateTestSetShowYn(testSetId, modifyTestSetShowYnVO.getShowYn()));
	}
	
	@RequireAction(domain = "EXAM", action = "COURSE_SET_DELETE", description = "시험 세트 삭제")
	@DeleteMapping("admin/system/testSet/{testSetId}")
	public ApiResponse<String> deleteTestSet(@PathVariable String testSetId){
		String result = this.examService.deleteTestSet(testSetId);
		return ApiResponse.OK(result);
	}
	
	@RequireAction(domain = "EXAM", action = "COURSE_SET_READ", description = "시험 세트 조회")
	@GetMapping("admin/system/{testSetId}/questionlist")
	public ApiResponse<ExamQuestionListVO> viewTestSetQuestions (@PathVariable String testSetId){
		ExamQuestionListVO questionList = this.examService.viewTestSetQuestions(testSetId);
		return ApiResponse.OK(questionList);
	}
	
	/**
	 * 시험 응시용 문제 조회 (정답 제외).
	 * 권한은 답안 제출과 같은 EXAM_COURSE_EXAM_SUBMIT: 응시할 수 있는 사람만 문제를 받는다.
	 * 정답이 들어 있는 admin/system/{testSetId}/questionlist 는 강사 · 관리자용 (문제 보기 · 채점).
	 */
	@RequireAction(domain = "EXAM", action = "COURSE_EXAM_SUBMIT", description = "시험 답안 제출")
	@GetMapping("my/test/{testSetId}/questions")
	public ApiResponse<ExamQuestionListVO> viewTestSetQuestionsForTake(@PathVariable String testSetId,
													Authentication authentication) {
		String userId = authentication.getName();
		return ApiResponse.OK(this.examService.viewTestSetQuestionsForTake(testSetId, userId));
	}

	/**
	 * 시험 답안 제출.
	 * 권한 코드 EXAM_SUBMIT: SUPER_ADMIN은 항상 허용, 수강생(ROLE_STUDENT)은 권한 관리 화면에서 부여해야 한다.
	 * 응시자 ID는 요청 body가 아니라 로그인 정보(JWT)에서 꺼낸다.
	 */
	@RequireAction(domain = "EXAM", action = "COURSE_EXAM_SUBMIT", description = "시험 답안 제출")
	@PostMapping("my/test/{testSetId}")
	public ApiResponse<String> createTestAnswerByTestSetId(@PathVariable String testSetId,
													@RequestBody RegistTestAnswersListVO answersVO,
													Authentication authentication){
		String userId = authentication.getName();
		this.examService.createTestAnswerByTestSetId(testSetId, userId, answersVO);
		return ApiResponse.OK("제출완료");
	}
	
	@RequireAction(domain = "EXAM", action = "COURSE_EXAM_ANSWER_READ", description = "시험 답안 조회")
	@GetMapping("admin/{testSetId}/correct/{userId}")
	public ApiResponse<List<ExamQuestionAnswerVO>> isCorrectSetByUserId(@PathVariable String testSetId , @PathVariable String userId){
		List<ExamQuestionAnswerVO> answerList = this.examService.isCorrectSetByUserId(testSetId,userId);
		return ApiResponse.OK(answerList);
	}

	/**
	 * 답안 1건의 채점 결과 수정 (강사 수동 채점).
	 * body: { "isCorrect": "Y" | "N" | "H" }
	 * 권한 코드 EXAM_GRADE: SUPER_ADMIN은 항상 허용, 강사 · 관리자는 권한 관리 화면에서 부여해야 한다.
	 */
	@RequireAction(domain = "EXAM", action = "COURSE_EXAM_GRADE", description = "시험 답안 채점")
	@PutMapping("admin/test/answer/{answerId}/grade")
	public ApiResponse<String> updateAnswerGrade(@PathVariable String answerId,
			@Valid @RequestBody ModifyAnswerGradeVO modifyAnswerGradeVO) {
		return ApiResponse.OK(
				this.examService.updateAnswerGrade(answerId, modifyAnswerGradeVO.getIsCorrect()));
	}
	
	
}
