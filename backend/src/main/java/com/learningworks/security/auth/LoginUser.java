package com.learningworks.security.auth;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import com.learningworks.member.vo.response.MemberVO;

public class LoginUser implements UserDetails {

  public static final int MAX_LOGIN_FAIL_COUNT = 5;
  public static final int LOCK_MINUTES = 30;

  private final String id;
  private final String password;
  private final String salt;
  private final String name;
  private final boolean locked;
  private final boolean deleted;
  private final List<GrantedAuthority> authorities;

  public LoginUser(MemberVO member) {
    this(member, LocalDateTime.now());
  }

  public LoginUser(MemberVO member, LocalDateTime now) {
    if (member == null) {
      throw new IllegalArgumentException("회원 정보가 null 입니다.");
    }
    if (now == null) {
      throw new IllegalArgumentException("기준 시간이 null 입니다.");
    }

    this.id = member.getId();
    this.password = member.getPassword();
    this.salt = member.getSalt();
    this.name = member.getName();
    this.locked = LoginUser.isLocked(member, now);
    this.deleted = "Y".equals(member.getDelYn());

    List<GrantedAuthority> list = new ArrayList<>();
    if (member.getRoles() != null) {
      for (String role : member.getRoles()) {
        list.add(new SimpleGrantedAuthority(role));
      }
    }
    this.authorities = List.copyOf(list);

  }

  private static boolean isLocked(MemberVO member, LocalDateTime now) {
    if (member.getLoginFailCount() < LoginUser.MAX_LOGIN_FAIL_COUNT) {
      return false;
    }
    if (member.getLoginBlockDate() == null) {
      return false;
    }
    LocalDateTime unlockAt = member.getLoginBlockDate().plusMinutes(LoginUser.LOCK_MINUTES);
    return now.isBefore(unlockAt);
  }


  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    return this.authorities;
  }

  @Override
  public @Nullable String getPassword() {
    return this.password;
  }

  @Override
  public String getUsername() {
    return this.id;
  }

  @Override
  public boolean isAccountNonLocked() {
    return !this.locked;
  }

  @Override
  public boolean isEnabled() {
    return !this.deleted;
  }

  public String getSalt() {
    return this.salt;
  }

  public String getName() {
    return this.name;
  }

}
