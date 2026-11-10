package com.learningworks.access.vo.response;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.groups.Default;
import lombok.Data;

// 요청 본문(/access/save)으로도 사용
@Data
public class AccessVO {

    /** 등록(addedList)에만 적용하는 검증 그룹. Default를 상속하므로 기본 검증도 함께 실행된다. */
    public interface Add extends Default {
    }

    private String actionId;

    // 등록 시에만 저장 (updateAccess의 SET에는 포함하지 않음, R-09 5번)
    // 등록부(ActionCodeRegistry)에 있는 코드인지는 서비스에서 확인
    @NotBlank(message = "권한 코드를 선택해주세요.", groups = Add.class)
    @Size(max = 40, message = "권한 코드는 40자 이하로 입력해주세요.")
    private String actionCode;

    @NotBlank(message = "접근 권한명을 입력해주세요.")
    @Size(max = 40, message = "접근 권한명은 40자 이하로 입력해주세요.")
    private String actionName;

    @NotBlank(message = "대 메뉴를 선택해주세요.")
    private String topMenuId;

    @NotBlank(message = "중 메뉴를 선택해주세요.")
    private String midMenuId;

    @NotBlank(message = "소 메뉴를 선택해주세요.")
    private String btmMenuId;
}
