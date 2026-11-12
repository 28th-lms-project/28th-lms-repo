package com.learningworks.member.web;

import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
import com.learningworks.member.vo.request.MemberChangeRoleVO;
import com.learningworks.member.vo.request.MemberCreateVO;
import com.learningworks.member.vo.request.MemberSearchVO;
import com.learningworks.member.vo.request.ModifyInfoVO;
import com.learningworks.member.vo.request.ModifyMemberVO;
import com.learningworks.member.vo.request.ModifyPasswordVO;
import com.learningworks.member.vo.request.ResetPasswordVO;
import com.learningworks.member.vo.request.VerifyRequestVO;
import com.learningworks.member.vo.response.MemberDetailVO;
import com.learningworks.member.vo.response.MemberListVO;
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

  @RequireAction(domain = "MEMBER", action = "READ_LIST", description = "회원 목록 조회")
  @GetMapping
  public ApiResponse<List<MemberListVO>> readMemberList(MemberSearchVO searchVO) {
    List<MemberListVO> list = this.memberService.readMemberList(AuthUtil.getLoginId(), searchVO);
    return ApiResponse.OK(list, searchVO);
  }

  @RequireAction(domain = "MEMBER", action = "READ_DETAIL", description = "회원 상세 조회")
  @GetMapping("/{id}")
  public ApiResponse<MemberDetailVO> readMember(@PathVariable("id") String targetId) {
    MemberDetailVO result = this.memberService.readMember(AuthUtil.getLoginId(), targetId);
    return ApiResponse.OK(result);
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

  @RequireAction(domain = "MEMBER", action = "UPDATE", description = "회원 정보 수정")
  @PutMapping("/{id}")
  public ApiResponse<MemberDetailVO> updateMember(@PathVariable("id") String targetId,
      @Valid @RequestBody ModifyMemberVO modifyVO) {
    String actorId = AuthUtil.getLoginId();

    MemberDetailVO result = this.memberService.updateMember(actorId, targetId, modifyVO);

    return ApiResponse.OK(result);
  }

  @RequireAction(domain = "MEMBER", action = "DELETE", description = "회원 삭제")
  @DeleteMapping("/{id}")
  public ApiResponse<Void> deleteMember(@PathVariable("id") String targetId) {
    String actorId = AuthUtil.getLoginId();
    this.memberService.deleteMember(actorId, targetId);

    return ApiResponse.OK(null);
  }

  @RequireAction(domain = "MEMBER", action = "RESET_PASSWORD", description = "비밀번호 초기화")
  @PutMapping("/{id}/password")
  public ApiResponse<Void> resetPassword(@PathVariable("id") String targetId,
      @Valid @RequestBody ResetPasswordVO passwordVO) {
    String actorId = AuthUtil.getLoginId();
    this.memberService.resetPassword(actorId, targetId, passwordVO);

    return ApiResponse.OK(null);
  }

  @RequireAction(domain = "MEMBER", action = "CHANGE_ROLE", description = "회원 역할 변경")
  @PutMapping("/{id}/role")
  public ApiResponse<MemberDetailVO> changeRole(@PathVariable("id") String targetId,
      @Valid @RequestBody MemberChangeRoleVO changeVO) {
    String actorId = AuthUtil.getLoginId();
    MemberDetailVO result = this.memberService.changeRole(actorId, targetId, changeVO.getRoleId());

    return ApiResponse.OK(result);
  }

}
