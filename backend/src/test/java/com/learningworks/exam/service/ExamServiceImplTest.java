package com.learningworks.exam.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.exam.dao.ExamDao;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import jakarta.validation.Validation;

@ExtendWith(MockitoExtension.class)
class ExamServiceImplTest {
    private static final String EXAM_ID = "TT-20261106-000001";
    @Mock private ExamDao examDao;
    @InjectMocks private ExamServiceImpl examService;

    private ModifyExamQuestionVO validRequest() {
        ModifyExamQuestionVO request = new ModifyExamQuestionVO();
        request.setQuestion("Java primitive type?");
        request.setAnswerType("MULTIPLE_CHOICE");
        request.setAnswerSheet1("int");
        request.setAnswerSheet2("String");
        request.setAnswerCount(2);
        request.setPointAlloc(4);
        request.setCorrectAnswer("1");
        return request;
    }

    private void assertInvalidAnswers(ModifyExamQuestionVO request) {
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        LearningworksException exception = assertThrows(LearningworksException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, request));
        assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        verify(this.examDao).selectQuestionById(EXAM_ID);
        verifyNoMoreInteractions(this.examDao);
    }

    @Test
    void rejectsNullIdBeforeDaoAccess() {
        assertThrows(LearningworksException.class,
                () -> this.examService.updateExamQuestion(null, this.validRequest()));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsBlankIdBeforeDaoAccess() {
        assertThrows(LearningworksException.class,
                () -> this.examService.updateExamQuestion(" ", this.validRequest()));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsNullRequestBeforeDaoAccess() {
        assertThrows(LearningworksException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, null));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void missingQuestionDoesNotUpdate() {
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(null);
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, this.validRequest()));
        assertEquals("존재하지 않는 문제입니다.", exception.getMessage());
        verify(this.examDao).selectQuestionById(EXAM_ID);
        verifyNoMoreInteractions(this.examDao);
    }

    @Test
    void zeroUpdatedRowsDoesNotReadAgain() {
        ModifyExamQuestionVO request = this.validRequest();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        when(this.examDao.updateExamQuestion(EXAM_ID, request)).thenReturn(0);
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, request));
        assertEquals("문제 수정에 실패했습니다.", exception.getMessage());
        verify(this.examDao).selectQuestionById(EXAM_ID);
        verify(this.examDao).updateExamQuestion(EXAM_ID, request);
        verifyNoMoreInteractions(this.examDao);
    }

    @Test
    void returnsUpdatedQuestion() {
        ModifyExamQuestionVO request = this.validRequest();
        ExamQuestionVO updated = new ExamQuestionVO();
        updated.setId(EXAM_ID);
        updated.setQuestion(request.getQuestion());
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO(), updated);
        when(this.examDao.updateExamQuestion(EXAM_ID, request)).thenReturn(1);
        assertSame(updated, this.examService.updateExamQuestion(EXAM_ID, request));
        verify(this.examDao, times(2)).selectQuestionById(EXAM_ID);
        verify(this.examDao).updateExamQuestion(EXAM_ID, request);
        verifyNoMoreInteractions(this.examDao);
    }

    @Test
    void rejectsMissingRequiredAnswer() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setAnswerSheet2(" ");
        this.assertInvalidAnswers(request);
    }

    @Test
    void rejectsExtraAnswer() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setAnswerSheet3("byte");
        this.assertInvalidAnswers(request);
    }

    @Test
    void rejectsNullAnswerCount() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setAnswerCount(null);
        this.assertInvalidAnswers(request);
    }

    @Test
    void rejectsOutOfRangeAnswerCount() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setAnswerCount(6);
        this.assertInvalidAnswers(request);
    }

    @Test
    void rejectsNonNumericCorrectAnswer() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setCorrectAnswer("int");
        this.assertInvalidAnswers(request);
    }

    @Test
    void rejectsCorrectAnswerOutsideChoices() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setCorrectAnswer("3");
        this.assertInvalidAnswers(request);
    }

    @Test
    void requestValidationAcceptsValidInputWithoutBodyIds() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            assertTrue(factory.getValidator().validate(this.validRequest()).isEmpty());
        }
    }

    @Test
    void requestValidationRejectsMissingAndOutOfRangeFields() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setQuestion(" ");
            request.setAnswerCount(null);
            request.setPointAlloc(5);
            request.setCorrectAnswer( "");
            Set<String> fields = factory.getValidator().validate(request).stream()
                    .map(violation -> violation.getPropertyPath().toString())
                    .collect(Collectors.toSet());
            assertEquals(Set.of("question", "answerCount", "pointAlloc", "correctAnswer"), fields);
        }
    }
}