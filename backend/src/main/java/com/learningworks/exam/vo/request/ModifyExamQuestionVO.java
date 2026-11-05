package com.learningworks.exam.vo.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ModifyExamQuestionVO {
    @NotBlank(message = "문제 내용을 입력해주세요.")
    @Size(max = 200)
    private String question;

    @NotBlank(message = "답변 유형을 선택해주세요.")
    @Size(max = 4000)
    private String answerType;

    @NotBlank(message = "첫 번째 보기를 입력해주세요.")
    @Size(max = 200)
    private String answerSheet1;

    @Size(max = 200)
    private String answerSheet2;
    @Size(max = 200)
    private String answerSheet3;
    @Size(max = 200)
    private String answerSheet4;
    @Size(max = 200)
    private String answerSheet5;

    @NotNull(message = "보기 개수를 입력해주세요.")
    @Min(1)
    @Max(5)
    private Integer answerCount;

    @NotNull(message = "배점을 입력해주세요.")
    @Min(1)
    @Max(4)
    private Integer pointAlloc;

    @NotBlank(message = "정답을 입력해주세요.")
    @Size(max = 200)
    private String correctAnswer;

    @Size(max = 200)
    private String subQuestion;
}