package com.learningworks.member.web;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.learningworks.common.action.LoginRequired;
import com.learningworks.common.action.RequireAction;
import com.learningworks.common.utils.ApiResponse;
import com.learningworks.common.utils.AuthUtil;
import com.learningworks.member.service.MemberService;
import com.learningworks.member.vo.request.MemberCreateVO;
import com.learningworks.member.vo.request.ModifyInfoVO;
import com.learningworks.member.vo.request.ModifyPasswordVO;
import com.learningworks.member.vo.request.VerifyRequestVO;
import com.learningworks.member.vo.response.MemberVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/members")
@RequiredArgsConstructor
public class MemberController {

  private final MemberService memberService;

  @RequireAction(domain = "MEMBER", action = "CREATE", description = "회원 등록")
  @PostMapping
  public ApiResponse<String> createMember(@Valid @RequestBody MemberCreateVO createVO) {
    String memberId = this.memberService.createMember(AuthUtil.getLoginId(), createVO);
    return ApiResponse.CREATED(memberId);
  }

  @LoginRequired
  @PostMapping("/me/password/verify")
  public ApiResponse<Void> verifyMyPassword(@Valid @RequestBody VerifyRequestVO verifyPasswordVO) {
    String id = AuthUtil.getLoginId();

    this.memberService.verifyPassword(id, verifyPasswordVO.getPassword());

    return ApiResponse.OK(null);
  }

  @LoginRequired
  @PutMapping("/me")
  public ApiResponse<MemberVO> updateMyInfo(@Valid @RequestBody ModifyInfoVO modifyInfoVO) {
    String id = AuthUtil.getLoginId();

    MemberVO result = this.memberService.updateMyInfo(id, modifyInfoVO);

    return ApiResponse.OK(result);
  }

  @LoginRequired
  @GetMapping("/me")
  public ApiResponse<MemberVO> selectMyInfo() {
    String id = AuthUtil.getLoginId();

    MemberVO result = this.memberService.selectMyInfo(id);

    return ApiResponse.OK(result);
  }

  @LoginRequired
  @PutMapping("/me/password")
  public ApiResponse<Void> updatePassword(@Valid @RequestBody ModifyPasswordVO passwordVO) {
    String id = AuthUtil.getLoginId();

    this.memberService.updatePassword(id, passwordVO);

    return ApiResponse.OK(null);
  }

}
