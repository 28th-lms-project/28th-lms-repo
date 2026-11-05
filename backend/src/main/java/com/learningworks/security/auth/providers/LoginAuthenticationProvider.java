package com.learningworks.security.auth.providers;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.dao.AbstractUserDetailsAuthenticationProvider;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.learningworks.security.auth.LoginPasswordValidator;
import com.learningworks.security.auth.LoginUser;
import lombok.RequiredArgsConstructor;

/**
 * retrieveUser → (잠금/삭제 검사) → additionalAuthenticationChecks → (비밀번호 만료 검사) → 인증 토큰 생성
 */
@RequiredArgsConstructor
public class LoginAuthenticationProvider extends AbstractUserDetailsAuthenticationProvider {

  private static final String BAD_CREDENTIAL_MESSAGE = "아이디 또는 비밀번호가 올바르지 않습니다.";

  private final UserDetailsService userDetailsService;
  private final LoginPasswordValidator loginPasswordValidator;



  @Override
  protected void additionalAuthenticationChecks(UserDetails userDetails,
      UsernamePasswordAuthenticationToken authentication) throws AuthenticationException {
    if (authentication.getCredentials() == null) {
      throw new BadCredentialsException(LoginAuthenticationProvider.BAD_CREDENTIAL_MESSAGE);
    }
    if (!(userDetails instanceof LoginUser loginUser)) {
      throw new InternalAuthenticationServiceException("지원하지 않는 사용자 타입입니다.");
    }

    String rawPassword = authentication.getCredentials().toString();

    if (!this.loginPasswordValidator.matches(rawPassword, loginUser)) {
      throw new BadCredentialsException(LoginAuthenticationProvider.BAD_CREDENTIAL_MESSAGE);
    }
  }

  @Override
  protected UserDetails retrieveUser(String username,
      UsernamePasswordAuthenticationToken authentication) throws AuthenticationException {
    try {
      UserDetails loadedUser = this.userDetailsService.loadUserByUsername(username);
      if (loadedUser == null) {
        throw new InternalAuthenticationServiceException("UserDetailsService 가 null 을 반환했습니다.");
      }
      return loadedUser;
    } catch (UsernameNotFoundException | InternalAuthenticationServiceException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new InternalAuthenticationServiceException(ex.getMessage(), ex);
    }
  }

}
