package com.learningworks.member.vo.request;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ModifyPasswordVO {

  @NotBlank(message = "현재 사용중인 비밀번호를 입력해주세요.")
  private String currentPassword;

  @NotBlank(message = "새 비밀번호를 입력해주세요.")
  @Size(min = 8, max = 20, message = "비밀번호는 8~20자로 작성해주세요.")
  private String newPassword;

  @NotBlank(message = "새 비밀번호 확인을 입력해주세요.")
  private String newPasswordConfirm;

  @AssertTrue(message = "새 비밀번호와 일치하지 않습니다.")
  public boolean isNewPasswordConfirmed() {
    if (this.newPassword == null || this.newPasswordConfirm == null) {
      return true;
    }
    return this.newPassword.equals(this.newPasswordConfirm);
  }

  @AssertTrue(message = "현재 비밀번호와 다른 비밀번호를 입력해주세요.")
  public boolean isNewPasswordDifferent() {
    if (this.newPassword == null || this.newPassword.isBlank()) {
      return true;
    }
    return !this.newPassword.equals(this.currentPassword);
  }

}
