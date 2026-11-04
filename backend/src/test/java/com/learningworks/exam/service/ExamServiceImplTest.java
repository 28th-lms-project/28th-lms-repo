package com.learningworks.exam.service;

import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.learningworks.exam.dao.ExamDao;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;

@ExtendWith(MockitoExtension.class)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ExamServiceImplTest {

	@Mock
	private ExamDao examDao;

	@InjectMocks
	private ExamServiceImpl examService;

	@Test
	@Order(1)
	@DisplayName("ID가 null이면 현재 구현은 조회 후 존재하지 않는 문제 예외를 던진다")
	void updateExamQuestionWithNullIdThrowsAfterLookup() {
		// Given
		ModifyExamQuestionVO request = new ModifyExamQuestionVO();
		Mockito.when(this.examDao.selectQuestionById(null)).thenReturn(null);

		// When
		RuntimeException exception = Assertions.assertThrows(RuntimeException.class,
				() -> this.examService.updateExamQuestion(null, request));

		// Then
		Assertions.assertEquals("존재하지 않는 문제입니다.", exception.getMessage());

		// Verify
		Mockito.verify(this.examDao, Mockito.times(1)).selectQuestionById(null);
		Mockito.verify(this.examDao, Mockito.never()).updateExamQuestion(null, request);
		Mockito.verifyNoMoreInteractions(this.examDao);
	}

	@Test
	@Order(2)
	@DisplayName("존재하지 않는 문제는 예외를 던지고 UPDATE를 호출하지 않는다")
	void updateExamQuestionWithMissingQuestionThrows() {
		// Given
		String examId = "TT-NOT-FOUND";
		ModifyExamQuestionVO request = new ModifyExamQuestionVO();
		Mockito.when(this.examDao.selectQuestionById(examId)).thenReturn(null);

		// When
		RuntimeException exception = Assertions.assertThrows(RuntimeException.class,
				() -> this.examService.updateExamQuestion(examId, request));

		// Then
		Assertions.assertEquals("존재하지 않는 문제입니다.", exception.getMessage());

		// Verify
		Mockito.verify(this.examDao, Mockito.times(1)).selectQuestionById(examId);
		Mockito.verify(this.examDao, Mockito.never()).updateExamQuestion(examId, request);
		Mockito.verifyNoMoreInteractions(this.examDao);
	}

	@Test
	@Order(3)
	@DisplayName("수정 건수가 0이면 수정 실패 예외를 던지고 재조회하지 않는다")
	void updateExamQuestionWithZeroUpdatedRowsThrows() {
		// Given
		String examId = "TT-20261104-000001";
		ModifyExamQuestionVO request = new ModifyExamQuestionVO();
		ExamQuestionVO existingQuestion = new ExamQuestionVO();
		Mockito.when(this.examDao.selectQuestionById(examId)).thenReturn(existingQuestion);
		Mockito.when(this.examDao.updateExamQuestion(examId, request)).thenReturn(0);

		// When
		RuntimeException exception = Assertions.assertThrows(RuntimeException.class,
				() -> this.examService.updateExamQuestion(examId, request));

		// Then
		Assertions.assertEquals("문제 수정에 실패했습니다.", exception.getMessage());

		// Verify
		Mockito.verify(this.examDao, Mockito.times(1)).selectQuestionById(examId);
		Mockito.verify(this.examDao, Mockito.times(1)).updateExamQuestion(examId, request);
		Mockito.verifyNoMoreInteractions(this.examDao);
	}

	@Test
	@Order(4)
	@Tag("unimplemented")
	@DisplayName("[미구현 요구사항] null ID는 DAO 접근 전에 거부되어야 한다")
	void updateExamQuestionWithNullIdShouldRejectBeforeDaoAccess() {
		// Given
		ModifyExamQuestionVO request = new ModifyExamQuestionVO();
		// null ID 전용 Validation 및 예외 타입은 아직 정의되지 않았다.
		// 예외 타입을 새로 가정하지 않고 DAO 사전 접근 차단 요구사항만 검증한다.

		// When
		RuntimeException exception = Assertions.assertThrows(RuntimeException.class,
				() -> this.examService.updateExamQuestion(null, request));

		// Then
		Assertions.assertNotNull(exception);

		// Verify
		// 현재는 selectQuestionById(null)이 호출되므로 의도적으로 실패한다.
		Mockito.verifyNoInteractions(this.examDao);
	}

	@Test
	@Order(5)
	@DisplayName("정상 수정 시 UPDATE를 1회 호출하고 재조회한 문제를 반환한다")
	void updateExamQuestionReturnsUpdatedQuestion() {
		// Given
		String examId = "TT-20261104-000001";
		ModifyExamQuestionVO request = new ModifyExamQuestionVO();
		request.setId(examId);
		request.setSubjectId("SUBJECT-001");
		request.setQuestion("수정된 시험문제");
		request.setAnswerType("MULTIPLE");
		request.setAnswerSheet1("보기 1");
		request.setAnswerSheet2("보기 2");
		request.setAnswerCount(2);
		request.setPointAlloc(5.0F);
		request.setCorrectAnswer("1");
		ExamQuestionVO existingQuestion = new ExamQuestionVO();
		existingQuestion.setId(examId);
		existingQuestion.setQuestion("기존 시험문제");
		ExamQuestionVO updatedQuestion = new ExamQuestionVO();
		updatedQuestion.setId(examId);
		updatedQuestion.setQuestion(request.getQuestion());
		Mockito.when(this.examDao.selectQuestionById(examId))
				.thenReturn(existingQuestion, updatedQuestion);
		Mockito.when(this.examDao.updateExamQuestion(examId, request)).thenReturn(1);

		// When
		ExamQuestionVO result = this.examService.updateExamQuestion(examId, request);

		// Then
		Assertions.assertSame(updatedQuestion, result);
		Assertions.assertEquals(examId, result.getId());
		Assertions.assertEquals(request.getQuestion(), result.getQuestion());

		// Verify
		Mockito.verify(this.examDao, Mockito.times(2)).selectQuestionById(examId);
		Mockito.verify(this.examDao, Mockito.times(1)).updateExamQuestion(examId, request);
		Mockito.verifyNoMoreInteractions(this.examDao);
	}

}
