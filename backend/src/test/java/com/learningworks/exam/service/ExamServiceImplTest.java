package com.learningworks.exam.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Set;
import java.util.stream.Collectors;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.ValidationFailedException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.exam.dao.ExamDao;
import com.learningworks.exam.vo.request.ModifyExamQuestionVO;
import com.learningworks.exam.vo.request.RegistExamQuestionVO;
import com.learningworks.exam.vo.response.ExamQuestionVO;
import jakarta.validation.Validation;

@ExtendWith(MockitoExtension.class)
class ExamServiceImplTest {
    private static final String EXAM_ID = "TT-20261106-000001";
    private static final String USER_ID = "dev_superadmin";
    @Mock private ExamDao examDao;
    @InjectMocks private ExamServiceImpl examService;

    /** 등록 테스트는 과목이 환경 변수에 있다고 본다 (과목 검사 테스트에서만 0으로 바꿈) */
    @BeforeEach
    void subjectExists() {
        lenient().when(this.examDao.countTestSubject(any())).thenReturn(1);
    }

    private ModifyExamQuestionVO validRequest() {
        ModifyExamQuestionVO request = new ModifyExamQuestionVO();
        request.setQuestion("Java primitive type?");
        request.setAnswerType("ANSWER_SELECT");
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
                () -> this.examService.updateExamQuestion(EXAM_ID, request, USER_ID));
        assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        verify(this.examDao).selectQuestionById(EXAM_ID);
        verifyNoMoreInteractions(this.examDao);
    }

    @Test
    void rejectsNullIdBeforeDaoAccess() {
        assertThrows(LearningworksException.class,
                () -> this.examService.updateExamQuestion(null, this.validRequest(), USER_ID));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsBlankIdBeforeDaoAccess() {
        assertThrows(LearningworksException.class,
                () -> this.examService.updateExamQuestion(" ", this.validRequest(), USER_ID));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsNullRequestBeforeDaoAccess() {
        assertThrows(LearningworksException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, null, USER_ID));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void missingQuestionDoesNotUpdate() {
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(null);
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, this.validRequest(), USER_ID));
        assertEquals("존재하지 않는 문제입니다.", exception.getMessage());
        verify(this.examDao).selectQuestionById(EXAM_ID);
        verifyNoMoreInteractions(this.examDao);
    }

    @Test
    void zeroUpdatedRowsDoesNotReadAgain() {
        ModifyExamQuestionVO request = this.validRequest();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        when(this.examDao.updateExamQuestion(EXAM_ID, request, USER_ID)).thenReturn(0);
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, request, USER_ID));
        assertEquals("문제 수정에 실패했습니다.", exception.getMessage());
        verify(this.examDao).selectQuestionById(EXAM_ID);
        verify(this.examDao).updateExamQuestion(EXAM_ID, request, USER_ID);
        verifyNoMoreInteractions(this.examDao);
    }

    @Test
    void returnsUpdatedQuestion() {
        ModifyExamQuestionVO request = this.validRequest();
        ExamQuestionVO updated = new ExamQuestionVO();
        updated.setId(EXAM_ID);
        updated.setQuestion(request.getQuestion());
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO(), updated);
        when(this.examDao.updateExamQuestion(EXAM_ID, request, USER_ID)).thenReturn(1);
        assertSame(updated, this.examService.updateExamQuestion(EXAM_ID, request, USER_ID));
        verify(this.examDao, times(2)).selectQuestionById(EXAM_ID);
        verify(this.examDao).updateExamQuestion(EXAM_ID, request, USER_ID);
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
            request.setPointAlloc(6); // 배점은 1~5점 (배점 = 난이도)
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
        request.setAnswerType("ANSWER_SELECT");
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
            for (String type : new String[] { "ANSWER_WRITE", "ANSWER_CODE" }) {
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
        when(this.examDao.insertNewExam(any(), eq(USER_ID))).thenReturn(1);
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        for (String type : new String[] { "ANSWER_WRITE", "ANSWER_CODE" }) {
            RegistExamQuestionVO request = new RegistExamQuestionVO();
            request.setId(EXAM_ID);
            request.setAnswerType(type);
            assertSame(saved, this.examService.createNewExam(request, USER_ID));
        }
        verify(this.examDao, times(2)).insertNewExam(any(), eq(USER_ID));
    }

    @Test
    void updatesManualQuestionsWithoutAnswers() {
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        when(this.examDao.updateExamQuestion(eq(EXAM_ID), any(), eq(USER_ID))).thenReturn(1);
        for (String type : new String[] { "ANSWER_WRITE", "ANSWER_CODE" }) {
            ModifyExamQuestionVO request = new ModifyExamQuestionVO();
            request.setAnswerType(type);
            assertSame(saved, this.examService.updateExamQuestion(EXAM_ID, request, USER_ID));
        }
        verify(this.examDao, times(2)).updateExamQuestion(eq(EXAM_ID), any(), eq(USER_ID));
    }

    @Test
    void clearsManualRegistrationAnswersBeforeInsert() {
        when(this.examDao.insertNewExam(any(), eq(USER_ID))).thenAnswer(invocation -> {
            RegistExamQuestionVO request = invocation.getArgument(0);
            this.assertEmptyAnswers(request.getCorrectAnswer(), request.getAnswerCount(),
                    request.getAnswerSheet1(), request.getAnswerSheet2(), request.getAnswerSheet3(),
                    request.getAnswerSheet4(), request.getAnswerSheet5());
            return 1;
        });
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        for (String type : new String[] { "ANSWER_WRITE", "ANSWER_CODE" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType(type);
            request.setAnswerSheet3("old3");
            request.setAnswerSheet4("old4");
            request.setAnswerSheet5("old5");
            this.examService.createNewExam(request, USER_ID);
        }
    }

    @Test
    void clearsOldAnswersWhenChangingToManualType() {
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        when(this.examDao.updateExamQuestion(eq(EXAM_ID), any(), eq(USER_ID))).thenAnswer(invocation -> {
            ModifyExamQuestionVO request = invocation.getArgument(1);
            this.assertEmptyAnswers(request.getCorrectAnswer(), request.getAnswerCount(),
                    request.getAnswerSheet1(), request.getAnswerSheet2(), request.getAnswerSheet3(),
                    request.getAnswerSheet4(), request.getAnswerSheet5());
            return 1;
        });
        for (String type : new String[] { "ANSWER_WRITE", "ANSWER_CODE" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType(type);
            request.setAnswerSheet3("old3");
            request.setAnswerSheet4("old4");
            request.setAnswerSheet5("old5");
            this.examService.updateExamQuestion(EXAM_ID, request, USER_ID);
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
                    () -> this.examService.createNewExam(request, USER_ID));
            assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        }
        verifyNoInteractions(this.examDao);
    }

    @Test
    void createsValidObjectiveQuestion() {
        RegistExamQuestionVO request = this.validRegistration();
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.insertNewExam(request, USER_ID)).thenReturn(1);
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        assertSame(saved, this.examService.createNewExam(request, USER_ID));
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
        assertThrows(LearningworksException.class, () -> this.examService.createNewExam(null, USER_ID));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void createsOxQuestionsAndClearsOldChoices() {
        when(this.examDao.insertNewExam(any(), eq(USER_ID))).thenAnswer(invocation -> {
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
            request.setAnswerType("ANSWER_CHECK");
            request.setCorrectAnswer(answer);
            request.setAnswerSheet3("old3");
            request.setAnswerSheet4("old4");
            request.setAnswerSheet5("old5");
            assertSame(saved, this.examService.createNewExam(request, USER_ID));
            assertEquals(answer, request.getCorrectAnswer());
        }
        verify(this.examDao, times(2)).insertNewExam(any(), eq(USER_ID));
    }

    @Test
    void updatesOxQuestionsWithoutChoices() {
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        when(this.examDao.updateExamQuestion(eq(EXAM_ID), any(), eq(USER_ID))).thenReturn(1);
        for (String answer : new String[] { "O", "X" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType("ANSWER_CHECK");
            request.setCorrectAnswer(answer);
            assertSame(saved, this.examService.updateExamQuestion(EXAM_ID, request, USER_ID));
            assertEquals(answer, request.getCorrectAnswer());
            this.assertEmptyAnswers(request.getAnswerCount(), request.getAnswerSheet1(),
                    request.getAnswerSheet2(), request.getAnswerSheet3(),
                    request.getAnswerSheet4(), request.getAnswerSheet5());
        }
        verify(this.examDao, times(2)).updateExamQuestion(eq(EXAM_ID), any(), eq(USER_ID));
    }

    @Test
    void rejectsInvalidOxRegistrationBeforeInsert() {
        for (String answer : new String[] { null, "", " ", "1", "0", "o", "x", "O,X" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType("ANSWER_CHECK");
            request.setCorrectAnswer(answer);
            LearningworksException exception = assertThrows(LearningworksException.class,
                    () -> this.examService.createNewExam(request, USER_ID));
            assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        }
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsInvalidOxModificationBeforeUpdate() {
        for (String answer : new String[] { null, "", " ", "1", "0", "o", "x", "O,X" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType("ANSWER_CHECK");
            request.setCorrectAnswer(answer);
            this.assertInvalidAnswers(request);
            clearInvocations(this.examDao);
        }
    }

    @Test
    void createsMultipleAnswerQuestionInNumericOrder() {
        RegistExamQuestionVO request = this.validRegistration();
        request.setAnswerType("ANSWER_MULTIPLE");
        request.setCorrectAnswer(" 2 , 1 ");
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.insertNewExam(request, USER_ID)).thenAnswer(invocation -> {
            assertEquals("1,2", request.getCorrectAnswer());
            return 1;
        });
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        assertSame(saved, this.examService.createNewExam(request, USER_ID));
        assertEquals(2, request.getAnswerCount());
        assertEquals("int", request.getAnswerSheet1());
    }

    @Test
    void updatesMultipleAnswerQuestionWithAllFiveAnswers() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setAnswerType("ANSWER_MULTIPLE");
        request.setAnswerCount(5);
        request.setAnswerSheet3("boolean");
        request.setAnswerSheet4("byte");
        request.setAnswerSheet5("long");
        request.setCorrectAnswer("5,3,1,4,2");
        ExamQuestionVO saved = new ExamQuestionVO();
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(saved);
        when(this.examDao.updateExamQuestion(EXAM_ID, request, USER_ID)).thenAnswer(invocation -> {
            assertEquals("1,2,3,4,5", request.getCorrectAnswer());
            return 1;
        });
        assertSame(saved, this.examService.updateExamQuestion(EXAM_ID, request, USER_ID));
    }

    @Test
    void rejectsInvalidMultipleAnswerRegistrationBeforeInsert() {
        for (String answer : new String[] { null, "", " ", "1", "1,1", "1, 1", "0,1", "1,3",
                "1,6", "-1,2", "1,", ",1", "1,,2", "A,2", "1.0,2", "01,2", "1;2" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType("ANSWER_MULTIPLE");
            request.setCorrectAnswer(answer);
            LearningworksException exception = assertThrows(LearningworksException.class,
                    () -> this.examService.createNewExam(request, USER_ID), String.valueOf(answer));
            assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
        }
        verifyNoInteractions(this.examDao);
    }

    @Test
    void rejectsInvalidMultipleAnswerModificationBeforeUpdate() {
        for (String answer : new String[] { null, "", "1", "1,1", "0,1", "1,3", "1,", "1,,2", "A,2" }) {
            ModifyExamQuestionVO request = this.validRequest();
            request.setAnswerType("ANSWER_MULTIPLE");
            request.setCorrectAnswer(answer);
            this.assertInvalidAnswers(request);
            clearInvocations(this.examDao);
        }
    }

    @Test
    void multipleAnswerQuestionsStillRequireAllChoices() {
        RegistExamQuestionVO request = this.validRegistration();
        request.setAnswerType("ANSWER_MULTIPLE");
        request.setCorrectAnswer("1,2");
        request.setAnswerSheet2(null);
        assertThrows(LearningworksException.class, () -> this.examService.createNewExam(request, USER_ID));
        verifyNoInteractions(this.examDao);
    }

    @Test
    void singleAnswerQuestionRejectsMultipleNumbers() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setCorrectAnswer("1,2");
        this.assertInvalidAnswers(request);
    }

    @Test
    void rejectsAnswerTypeOutsideCodeList() {
        // 옛 한글 이름 · 알 수 없는 값은 저장하지 않고 answerType 칸 오류로 알린다
        for (String type : new String[] { "객관식-단항", "MULTIPLE", "TEST2" }) {
            RegistExamQuestionVO request = this.validRegistration();
            request.setAnswerType(type);
            ValidationFailedException exception = assertThrows(ValidationFailedException.class,
                    () -> this.examService.createNewExam(request, USER_ID), type);
            assertEquals(ErrorCode.GLOBAL_INVALID_PARAMETER, exception.getErrorCode());
            assertTrue(exception.getValidations().containsKey("answerType"), type);
        }
        verifyNoInteractions(this.examDao);
    }

    @Test
    void reportsInvalidAnswerFieldByName() {
        ModifyExamQuestionVO request = this.validRequest();
        request.setAnswerSheet2(" ");
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        ValidationFailedException exception = assertThrows(ValidationFailedException.class,
                () -> this.examService.updateExamQuestion(EXAM_ID, request, USER_ID));
        assertTrue(exception.getValidations().containsKey("answerSheet2"));
    }

    @Test
    void passesLoginUserToInsert() {
        RegistExamQuestionVO request = this.validRegistration();
        when(this.examDao.insertNewExam(request, USER_ID)).thenReturn(1);
        when(this.examDao.selectQuestionById(EXAM_ID)).thenReturn(new ExamQuestionVO());
        this.examService.createNewExam(request, USER_ID);
        verify(this.examDao).insertNewExam(request, USER_ID);
    }

    @Test
    void rejectsSubjectOutsideCodeList() {
        RegistExamQuestionVO request = this.validRegistration();
        request.setSubjectId("FRONTEND");
        when(this.examDao.countTestSubject("FRONTEND")).thenReturn(0);
        ValidationFailedException exception = assertThrows(ValidationFailedException.class,
                () -> this.examService.createNewExam(request, USER_ID));
        assertTrue(exception.getValidations().containsKey("subjectId"));
        verify(this.examDao, never()).insertNewExam(any(), any());
    }
}
