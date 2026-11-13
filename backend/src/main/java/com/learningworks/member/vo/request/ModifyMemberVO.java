package com.learningworks.member.vo.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ModifyMemberVO {
  @NotBlank(message = "이름을 입력해주세요.")
  @Size(max = 10, message = "이름은 10자 이하로 입력해주세요.")
  private String name;

  @Pattern(regexp = "^$|^https://github\\.com/[A-Za-z0-9-]{1,39}/?$",
      message = "GitHub 주소는 https://github.com/아이디 형식으로 입력해주세요.")
  private String githubUrl;
}
