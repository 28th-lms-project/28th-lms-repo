package com.learningworks.member.service;

import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.member.dao.MemberDao;
import com.learningworks.member.vo.response.MemberVO;
import com.learningworks.security.auth.LoginUser;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

  private final MemberDao memberDao;

  @Transactional
  @Override
  public void increaseLoginFailCount(String id, LocalDateTime now) {
    MemberVO state = this.memberDao.selectLoginFailStateForUpdate(id);
    if (state == null) {
      return;
    }

    int failCount = state.getLoginFailCount() + 1;
    LocalDateTime blockDate = state.getLoginBlockDate();

    if (blockDate != null && !now.isBefore(blockDate.plusMinutes(LoginUser.LOCK_MINUTES))) {
      failCount = 1;
      blockDate = null;
    } else if (failCount >= LoginUser.MAX_LOGIN_FAIL_COUNT) {
      blockDate = now;
    }

    this.memberDao.updateLoginFail(id, failCount, blockDate);
  }

  @Transactional
  @Override
  public void resetLoginFailCount(String id) {
    this.memberDao.updateLoginSuccess(id);
  }

}
