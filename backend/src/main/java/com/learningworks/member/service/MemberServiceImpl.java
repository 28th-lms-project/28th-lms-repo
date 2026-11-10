package com.learningworks.member.service;

import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.member.dao.MemberDao;
import com.learningworks.member.vo.request.ModifyInfoVO;
import com.learningworks.member.vo.response.MemberVO;
import com.learningworks.security.auth.LoginPasswordValidator;
import com.learningworks.security.auth.LoginUser;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

  private final MemberDao memberDao;
  // 상태가 없는 검증기이므로 빈으로 주입받지 않고 직접 생성한다. (SecurityConfig 와 동일)
  private final LoginPasswordValidator loginPasswordValidator = new LoginPasswordValidator();

  @Transactional(readOnly = true)
  @Override
  public MemberVO selectMyInfo(String id) {
    return this.memberDao.selectMyInfo(id);
  }

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

  /**
   * 로그인한 회원의 현재 비밀번호를 확인한다. 실패 횟수는 로그인과 공유한다.
   *
   * 비밀번호 불일치 시 예외를 던지면서도 실패 횟수 증가는 커밋되어야 하므로 LearningworksException 은 롤백 대상에서 제외한다. 불일치는 401 이 아닌
   * 400 으로 응답한다. (프론트 apiClient 가 401 을 받으면 로그아웃시키기 때문)
   */
  @Transactional(noRollbackFor = LearningworksException.class)
  @Override
  public void verifyPassword(String id, String rawPassword) {
    // 회원 정보 조회 (없거나 탈퇴한 회원)
    MemberVO member = this.memberDao.selectLoginMember(id);
    if (member == null || "Y".equals(member.getDelYn())) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }

    String salt = this.memberDao.selectSalt(id);
    LocalDateTime now = LocalDateTime.now();
    LoginUser loginUser = new LoginUser(member, salt, now);

    // 잠금 여부를 비밀번호 비교보다 먼저 검사한다. (잠긴 동안 비밀번호 대입 방지)
    if (!loginUser.isAccountNonLocked()) {
      throw new LearningworksException(ErrorCode.USER_BLOCKED_LOGIN);
    }

    // salt · 해시가 비어 있는 경우도 불일치로 처리된다.
    if (!this.loginPasswordValidator.matches(rawPassword, loginUser)) {
      this.increaseLoginFailCount(id, now);
      throw new LearningworksException(ErrorCode.GLOBAL_BAD_REQUEST);
    }

    this.resetLoginFailCount(id);
  }

  // 비밀번호가 틀려도 틀린 횟수는 롤백되지 않는다.
  @Transactional(noRollbackFor = LearningworksException.class)
  @Override
  public MemberVO updateMyInfo(String id, ModifyInfoVO infoVO) {
    this.verifyPassword(id, infoVO.getPassword());
    int updatedRows = this.memberDao.updateMyInfo(id, infoVO);
    if (updatedRows == 0) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }

    return this.memberDao.selectMyInfo(id);
  }

}
