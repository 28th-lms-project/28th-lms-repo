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
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
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
        request.setAnswerType("객관식-단항");
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
            // 보기 개수와 정답의 필수 여부는 서비스에서 유형에 따라 검증한다.
            assertEquals(Set.of("question", "pointAlloc"), fields);
        }
    }

    private RegistExamQuestionVO validRegistration() {
        RegistExamQuestionVO request = new RegistExamQuestionVO();
        request.setId(EXAM_ID);
        request.setSubjectId("JAVA");
        request.setQuestion("문제");
        request.setAnswerType("객관식-단항");
        request.setPointAlloc(4);
        request.setAnswerCount(2);
        request.setAnswerSheet1("int");
        request.setAnswerSheet2("String");
        request.setCorrectAnswer("1");
        return request;
    }

    private void assertEmptyAnswers(Object... fields) {
        for (Object field : fields) {
            assertNull(field);
        }
    }

    @Test
    void manualRequestsPassBeanValidationWithoutAnswers() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            for (String type : new String[] { "주관식", "코드작성" }) {
                RegistExamQuestionVO registration = new RegistExamQuestionVO();
                registration.setSubjectId("JAVA");
                registration.setQuestion("문제");
                registration.setAnswerType(type);
                registration.setPointAlloc(4);
                assertTrue(factory.getValidator().validate(registration).isEmpty(), type);

                ModifyExamQuestionVO modification = new ModifyExamQuestionVO();
                modification.setQuestion("문제");
                modification.setAnswerType(type);
                modification.setPointAlloc(4);
                assertTrue(factory.getValidator().validate(modification).isEmpty(), type);
            }
        }
    }

    @Test
    void createsManualQuestionsWithoutAnswers() {
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.insertNewExam(any())).thenReturn(1);
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        for (String type : new String[] { "주관식", "코드작성" }) {
            RegistExamQuestionVO request = new RegistExamQuestionVO();
            request.setId(EXAM_ID);
            request.setAnswerType(type);
            assertSame(saved, this.examService.createNewExam(request));
        }
        verify(this.examDao, times(2)).insertNewExam(any());
    }

    @Test
    void updatesManualQuestionsWithoutAnswers() {
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        when(this.examDao.updateExamQuestion(eq(EXAM_ID), any())).thenReturn(1);
        for (String type : new String[] { "주관식", "코드작성" }) {
            ModifyExamQuestionVO request = new ModifyExamQuestionVO();
            request.setAnswerType(type);
            assertSame(saved, this.examService.updateExamQuestion(EXAM_ID, request));
        }
        verify(this.examDao, times(2)).updateExamQuestion(eq(EXAM_ID), any());
    }

    @Test
    void clearsManualRegistrationAnswersBeforeInsert() {
        when(this.examDao.insertNewExam(any())).thenAnswer(invocation -> {
            RegistExamQuestionVO request = invocation.getArgument(0);
            this.assertEmptyAnswers(request.getCorrectAnswer(), request.getAnswerCount(),
                    request.getAnswerSheet1(), request.getAnswerSheet2(), request.getAnswerSheet3(),
                    request.getAnswerSheet4(), request.getAnswerSheet5());
            return 1;
        });
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        for (String type : new String[] { "주관식", "코드작성" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType(type);
            request.setAnswerSheet3("old3");
            request.setAnswerSheet4("old4");
            request.setAnswerSheet5("old5");
            this.examService.createNewExam(request);
        }
    }

    @Test
    void clearsOldAnswersWhenChangingToManualType() {
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        when(this.examDao.updateExamQuestion(eq(EXAM_ID), any())).thenAnswer(invocation -> {
            ModifyExamQuestionVO request = invocation.getArgument(1);
            this.assertEmptyAnswers(request.getCorrectAnswer(), request.getAnswerCount(),
                    request.getAnswerSheet1(), request.getAnswerSheet2(), request.getAnswerSheet3(),
                    request.getAnswerSheet4(), request.getAnswerSheet5());
            return 1;
        });
        for (String type : new String[] { "주관식", "코드작성" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType(type);
            request.setAnswerSheet3("old3");
            request.setAnswerSheet4("old4");
            request.setAnswerSheet5("old5");
            this.examService.updateExamQuestion(EXAM_ID, request);
        }
    }

    @Test
    void rejectsInvalidObjectiveRegistrationBeforeInsert() {
        RegistExamQuestionVO[] requests = new RegistExamQuestionVO[5];
        for (int i = 0; i < requests.length; i++) {
            requests[i] = this.validRegistration();
        }
        requests[0].setAnswerCount(null);
        requests[1].setCorrectAnswer(null);
        requests[2].setAnswerSheet1(" ");
        requests[3].setCorrectAnswer("3");
        requests[4].setAnswerSheet3("extra");
        for (RegistExamQuestionVO request : requests) {
            LearningworksException exception = assertThrows(LearningworksException.class,
                    () -> this.examService.createNewExam(request));
            assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        }
        verifyNoInteractions(this.examDao);
    }

    @Test
    void createsValidObjectiveQuestion() {
        RegistExamQuestionVO request = this.validRegistration();
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.insertNewExam(request)).thenReturn(1);
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        assertSame(saved, this.examService.createNewExam(request));
        assertEquals("1", request.getCorrectAnswer());
        assertEquals(2, request.getAnswerCount());
        assertEquals("int", request.getAnswerSheet1());
    }

    @Test
    void rejectsMissingObjectiveCorrectAnswerOnUpdate() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setCorrectAnswer(null);
        this.assertInvalidAnswers(request);
    }

    @Test
    void rejectsNullRegistrationBeforeDaoAccess() {
        assertThrows(LearningworksException.class, () -> this.examService.createNewExam(null));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void createsOxQuestionsAndClearsOldChoices() {
        when(this.examDao.insertNewExam(any())).thenAnswer(invocation -> {
            RegistExamQuestionVO request = invocation.getArgument(0);
            this.assertEmptyAnswers(request.getAnswerCount(), request.getAnswerSheet1(),
                    request.getAnswerSheet2(), request.getAnswerSheet3(),
                    request.getAnswerSheet4(), request.getAnswerSheet5());
            assertTrue(Set.of("O", "X").contains(request.getCorrectAnswer()));
            return 1;
        });
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        for (String answer : new String[] { "O", "X" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType("O/X");
            request.setCorrectAnswer(answer);
            request.setAnswerSheet3("old3");
            request.setAnswerSheet4("old4");
            request.setAnswerSheet5("old5");
            assertSame(saved, this.examService.createNewExam(request));
            assertEquals(answer, request.getCorrectAnswer());
        }
        verify(this.examDao, times(2)).insertNewExam(any());
    }

    @Test
    void updatesOxQuestionsWithoutChoices() {
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        when(this.examDao.updateExamQuestion(eq(EXAM_ID), any())).thenReturn(1);
        for (String answer : new String[] { "O", "X" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType("O/X");
            request.setCorrectAnswer(answer);
            assertSame(saved, this.examService.updateExamQuestion(EXAM_ID, request));
            assertEquals(answer, request.getCorrectAnswer());
            this.assertEmptyAnswers(request.getAnswerCount(), request.getAnswerSheet1(),
                    request.getAnswerSheet2(), request.getAnswerSheet3(),
                    request.getAnswerSheet4(), request.getAnswerSheet5());
        }
        verify(this.examDao, times(2)).updateExamQuestion(eq(EXAM_ID), any());
    }

    @Test
    void rejectsInvalidOxRegistrationBeforeInsert() {
        for (String answer : new String[] { null, "", " ", "1", "0", "o", "x", "O,X" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType("O/X");
            request.setCorrectAnswer(answer);
            LearningworksException exception = assertThrows(LearningworksException.class,
                    () -> this.examService.createNewExam(request));
            assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        }
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsInvalidOxModificationBeforeUpdate() {
        for (String answer : new String[] { null, "", " ", "1", "0", "o", "x", "O,X" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType("O/X");
            request.setCorrectAnswer(answer);
            this.assertInvalidAnswers(request);
            clearInvocations(this.examDao);
        }
    }

    @Test
    void createsMultipleAnswerQuestionInNumericOrder() {
        RegistExamQuestionVO request = this.validRegistration();
        request.setAnswerType("객관식-다항");
        request.setCorrectAnswer(" 2 , 1 ");
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.insertNewExam(request)).thenAnswer(invocation -> {
            assertEquals("1,2", request.getCorrectAnswer());
            return 1;
        });
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        assertSame(saved, this.examService.createNewExam(request));
        assertEquals(2, request.getAnswerCount());
        assertEquals("int", request.getAnswerSheet1());
    }

    @Test
    void updatesMultipleAnswerQuestionWithAllFiveAnswers() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setAnswerType("객관식-다항");
        request.setAnswerCount(5);
        request.setAnswerSheet3("boolean");
        request.setAnswerSheet4("byte");
        request.setAnswerSheet5("long");
        request.setCorrectAnswer("5,3,1,4,2");
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        when(this.examDao.updateExamQuestion(EXAM_ID, request)).thenAnswer(invocation -> {
            assertEquals("1,2,3,4,5", request.getCorrectAnswer());
            return 1;
        });
        assertSame(saved, this.examService.updateExamQuestion(EXAM_ID, request));
    }

    @Test
    void rejectsInvalidMultipleAnswerRegistrationBeforeInsert() {
        for (String answer : new String[] { null, "", " ", "1", "1,1", "1, 1", "0,1", "1,3",
                "1,6", "-1,2", "1,", ",1", "1,,2", "A,2", "1.0,2", "01,2", "1;2" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType("객관식-다항");
            request.setCorrectAnswer(answer);
            LearningworksException exception = assertThrows(LearningworksException.class,
                    () -> this.examService.createNewExam(request), String.valueOf(answer));
            assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        }
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsInvalidMultipleAnswerModificationBeforeUpdate() {
        for (String answer : new String[] { null, "", "1", "1,1", "0,1", "1,3", "1,", "1,,2", "A,2" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType("객관식-다항");
            request.setCorrectAnswer(answer);
            this.assertInvalidAnswers(request);
            clearInvocations(this.examDao);
        }
    }

    @Test
    void multipleAnswerQuestionsStillRequireAllChoices() {
        RegistExamQuestionVO request = this.validRegistration();
        request.setAnswerType("객관식-다항");
        request.setCorrectAnswer("1,2");
        request.setAnswerSheet2(null);
        assertThrows(LearningworksException.class, () -> this.examService.createNewExam(request));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void singleAnswerQuestionRejectsMultipleNumbers() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setCorrectAnswer("1,2");
        this.assertInvalidAnswers(request);
    }
}
