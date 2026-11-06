package com.learningworks.common.action.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.RequireSuperAdmin;
import com.learningworks.common.action.service.ActionCodeService;
import com.learningworks.common.action.vo.response.ActionCodeListVO;
import com.learningworks.common.utils.ApiResponse;
import lombok.AllArgsConstructor;

@AllArgsConstructor
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

}
