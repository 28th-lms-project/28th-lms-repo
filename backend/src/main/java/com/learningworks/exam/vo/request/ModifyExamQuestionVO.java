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
    @Size(max = 200, message = "문제 내용은 200자 이하로 입력해주세요.")
    private String question;

    @NotBlank(message = "답변 유형을 선택해주세요.")
    @Size(max = 4000, message = "답변 유형은 4000자 이하로 입력해주세요.")
    private String answerType;

    @Size(max = 200, message = "첫 번째 보기는 200자 이하로 입력해주세요.")
    private String answerSheet1;

    @Size(max = 200, message = "두 번째 보기는 200자 이하로 입력해주세요.")
    private String answerSheet2;
    @Size(max = 200, message = "세 번째 보기는 200자 이하로 입력해주세요.")
    private String answerSheet3;
    @Size(max = 200, message = "네 번째 보기는 200자 이하로 입력해주세요.")
    private String answerSheet4;
    @Size(max = 200, message = "다섯 번째 보기는 200자 이하로 입력해주세요.")
    private String answerSheet5;

    @Min(value = 1, message = "보기 개수는 1개 이상이어야 합니다.")
    @Max(value = 5, message = "보기 개수는 5개 이하여야 합니다.")
    private Integer answerCount;

    @NotNull(message = "배점을 입력해주세요.")
    @Min(value = 1, message = "배점은 1점 이상이어야 합니다.")
    @Max(value = 5, message = "배점은 5점 이하여야 합니다.") // 배점 1~5점 = 난이도 1~5 (문제 관리 난이도 필터)
    private Integer pointAlloc;

    @Size(max = 200, message = "정답은 200자 이하로 입력해주세요.")
    private String correctAnswer;

    @Size(max = 2000, message = "부가 설명은 2000자 이하로 입력해주세요.")
    private String subQuestion;
}
