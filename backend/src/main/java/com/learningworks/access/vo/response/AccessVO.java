package com.learningworks.access.vo.response;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// 요청 본문(/access/save)으로도 사용
@Data
public class AccessVO {

    private String actionId;

    // TODO: ACTION.ACTION_NAME 컬럼 길이 확인 후 @Size(max = n) 추가
    @NotBlank(message = "접근 권한명을 입력해주세요.")
    private String actionName;

    @NotBlank(message = "대 메뉴를 선택해주세요.")
    private String topMenuId;

    @NotBlank(message = "중 메뉴를 선택해주세요.")
    private String midMenuId;

    @NotBlank(message = "소 메뉴를 선택해주세요.")
    private String btmMenuId;
}
