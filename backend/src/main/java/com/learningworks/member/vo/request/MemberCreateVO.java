package com.learningworks.member.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MemberCreateVO {

  @NotBlank(message = "아이디를 입력해주세요.")
  @Size(max = 20, message = "아이디는 20자 이하로 입력해주세요.")
  private String id;

  @NotBlank(message = "비밀번호를 입력해주세요.")
  @Size(min = 8, max = 20, message = "비밀번호는 8~20자로 작성해주세요.")
  private String password;

  @NotBlank(message = "이름을 입력해주세요.")
  @Size(max = 10, message = "이름은 10자 이하로 입력해주세요.")
  private String name;

  @Pattern(regexp = "^$|^https://github\\.com/[A-Za-z0-9-]{1,39}/?$",
      message = "GitHub 주소는 https://github.com/아이디 형식으로 입력해주세요.")
  private String githubUrl;

  @NotBlank(message = "권한 지정은 필수입니다.")
  private String baseRole; // 예: "ROLE_STUDENT", "ROLE_TUTOR", "ROLE_ADMIN"
}
