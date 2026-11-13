package com.learningworks.menu.vo.request;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 메뉴 수정 요청. 상위 메뉴는 바꿀 수 없다.
 * spread(중메뉴만), menuUrl(소메뉴만)은 메뉴 단계에 따라 규칙이 달라서 서비스에서 검사한다.
 */
@Data
public class ModifyMenuVO {

  /** MENU.TITLE - VARCHAR2(100 CHAR). 앞뒤 공백을 제거해 저장 */
  @NotBlank(message = "메뉴 이름을 입력해주세요.")
  @Size(max = 100, message = "메뉴 이름은 100자 이하로 입력해주세요.")
  private String title;

  @NotNull(message = "사용 여부가 올바르지 않습니다.")
  @Pattern(regexp = "^[YN]$", message = "사용 여부가 올바르지 않습니다.")
  private String useYn;

  /** 중메뉴만 필수(Y/N). 그 외에는 무시하고 N 저장 */
  private String spread;

  /** 소메뉴만 필수. 그 외에는 무시하고 null 저장 */
  private String menuUrl;

  /** 빈 배열 허용. SUPER_ADMIN은 저장하지 않고 건너뛴다 */
  @NotNull(message = "역할 목록을 입력해주세요.")
  private List<String> roleIds;

  /** 화면을 열 때 받은 mdfyDt 그대로 (수정된 적 없으면 null). 서버 값과 다르면 MENU_OUTDATED */
  private String mdfyDt;

}
