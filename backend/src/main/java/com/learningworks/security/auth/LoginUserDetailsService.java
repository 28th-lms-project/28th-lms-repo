package com.learningworks.security.auth;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.learningworks.member.dao.MemberDao;
import com.learningworks.member.vo.response.MemberVO;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class LoginUserDetailsService implements UserDetailsService {

  private final MemberDao memberDao;

  @Override
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    MemberVO member = this.memberDao.selectLoginMember(username);

    if (member == null) {
      throw new UsernameNotFoundException("아이디 또는 비밀번호가 올바르지 않습니다.");
    }

    String salt = this.memberDao.selectSalt(username);
    return new LoginUser(member, salt);
  }

}
