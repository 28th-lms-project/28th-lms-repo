package com.learningworks.common.action.web;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.RequireSuperAdmin;
import com.learningworks.common.action.service.ActionCodeService;
import com.learningworks.common.action.vo.response.ActionCodeListVO;
import com.learningworks.common.action.vo.response.MyActionCodeVO;
import com.learningworks.common.utils.ApiResponse;
import lombok.AllArgsConstructor;
import io.swagger.v3.oas.annotations.tags.Tag;

@AllArgsConstructor
@Tag(name = "권한 코드", description = "서버에 등록된 권한 코드 목록, 내 권한")
@RestController
@RequestMapping("/action-codes")
public class ActionCodeController {

  private ActionCodeService actionCodeService;

  /** 권한 코드 목록. ACTION 관리 화면의 드롭다운용 (D-03: ACTION 관리는 SUPER_ADMIN 전용) */
  @RequireSuperAdmin
  @GetMapping
  public ApiResponse<ActionCodeListVO> getActionCodes() {
    ActionCodeListVO actionCodeListVO = this.actionCodeService.readActionCodeList();

    return ApiResponse.OK(actionCodeListVO);
  }

  /**
   * 내 권한: 로그인 사용자의 현재 역할과 허용된 권한 코드. 프론트가 버튼 · 기능 표시 여부를 판단하는 데 사용한다.
   *
   * 로그인한 사용자라면 누구나 호출할 수 있다 (@LoginRequired). 비로그인이면 401.
   * 권한 검사 설정(app.access-check.enabled)과 관계없이 항상 동작한다 (검사가 꺼져 있어도 서비스에서 비로그인 401).
   */
  @LoginRequired
  @GetMapping("/me")
  public ApiResponse<MyActionCodeVO> getMyActionCodes(
      // JWT 인증 필터가 principal에 회원 ID(String)를 넣는다. 비로그인(익명)이면 null
      Authentication authentication) {
    String userId = authentication == null ? null : authentication.getName();
    MyActionCodeVO myActionCodeVO = this.actionCodeService.readMyActionCodes(userId);

    return ApiResponse.OK(myActionCodeVO);
  }

}
