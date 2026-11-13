package com.learningworks.member.service;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.common.utils.crypto.SHA;
import com.learningworks.member.dao.MemberDao;
import com.learningworks.member.vo.request.MemberCreateVO;
import com.learningworks.member.vo.request.MemberSearchVO;
import com.learningworks.member.vo.request.ModifyInfoVO;
import com.learningworks.member.vo.request.ModifyMemberVO;
import com.learningworks.member.vo.request.ModifyPasswordVO;
import com.learningworks.member.vo.request.ResetPasswordVO;
import com.learningworks.member.vo.response.MemberDetailVO;
import com.learningworks.member.vo.response.MemberListVO;
import com.learningworks.member.vo.response.MemberVO;
import com.learningworks.role.service.RoleAssignPolicy;
import com.learningworks.security.auth.LoginPasswordValidator;
import com.learningworks.security.auth.LoginUser;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

  private final RoleAssignPolicy roleAssignPolicy;
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

  @Transactional(noRollbackFor = LearningworksException.class)
  @Override
  public void updatePassword(String id, ModifyPasswordVO passwordVO) {
    // 현재 비밀번호 확인
    this.verifyPassword(id, passwordVO.getCurrentPassword());

    // 새 Salt 생성
    String newSalt = SHA.generateSalt();
    String newHash = SHA.getEncrypt(passwordVO.getNewPassword(), newSalt);

    // Salt 테이블 및 내 정보 테이블의 변경
    // 한쪽이라도 실패했을 경우 RollBack 하도록 LearningworksException이 아닌 다른 예외를 던진다.
    if (this.memberDao.updatePassword(id, newHash) == 0) {
      throw new IllegalStateException("비밀번호 변경 실패");
    }
    if (this.memberDao.updateSalt(id, newSalt, id) == 0) {
      throw new IllegalStateException("Salt 변경 실패");
    }

  }

  @Transactional
  @Override
  public String createMember(String actorId, MemberCreateVO createVO) {
    this.roleAssignPolicy.checkCreatable(actorId, createVO.getBaseRole());

    if (this.memberDao.selectIdCount(createVO.getId()) > 0) {
      throw new LearningworksException(ErrorCode.USER_USED);
    }

    String salt = SHA.generateSalt();
    String encryptedPassword = SHA.getEncrypt(createVO.getPassword(), salt);

    if (this.memberDao.insertUser(createVO, encryptedPassword) == 0) {
      throw new LearningworksException(ErrorCode.GLOBAL_SYSTEM_ERROR);
    }
    if (this.memberDao.insertSalt(createVO.getId(), salt, actorId) == 0) {
      throw new LearningworksException(ErrorCode.GLOBAL_SYSTEM_ERROR);
    }

    return createVO.getId();
  }

  @Transactional(readOnly = true)
  @Override
  public List<MemberListVO> readMemberList(String actorId, MemberSearchVO searchVO) {
    // 관리 대상(자기보다 아래 역할, 본인 제외)만 조회. 클라이언트가 보낸 값은 덮어쓴다.
    searchVO.setActorRankBoundary(this.roleAssignPolicy.findManageableRankBoundary(actorId));
    searchVO.setActorId(actorId);

    long count = this.memberDao.selectMemberCount(searchVO);
    searchVO.calculatePageCount(count);

    if (count == 0) {
      return List.of();
    }

    return this.memberDao.selectMemberList(searchVO);
  }

  @Transactional(readOnly = true)
  @Override
  public MemberDetailVO readMember(String actorId, String targetId) {
    this.roleAssignPolicy.checkManageable(actorId, targetId);

    MemberDetailVO detail = this.memberDao.selectMemberDetail(targetId);
    if (detail == null) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }
    return detail;
  }

  @Transactional
  @Override
  public MemberDetailVO updateMember(String actorId, String targetId, ModifyMemberVO modifyVO) {
    this.roleAssignPolicy.checkManageable(actorId, targetId);
    int updatedRows = this.memberDao.updateMember(targetId, modifyVO);
    if (updatedRows == 0) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }

    return this.memberDao.selectMemberDetail(targetId);
  }

  @Transactional
  @Override
  public void deleteMember(String actorId, String targetId) {
    this.roleAssignPolicy.checkManageable(actorId, targetId);
    int updatedRows = this.memberDao.deleteMember(targetId);
    if (updatedRows == 0) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }

  }

  @Transactional
  @Override
  public void resetPassword(String actorId, String targetId, ResetPasswordVO resetPasswordVO) {
    this.roleAssignPolicy.checkManageable(actorId, targetId);

    String salt = SHA.generateSalt();
    String encryptedPassword = SHA.getEncrypt(resetPasswordVO.getPassword(), salt);
    if (this.memberDao.resetPassword(targetId, encryptedPassword) == 0) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }
    if (this.memberDao.updateSalt(targetId, salt, actorId) == 0) {
      throw new LearningworksException(ErrorCode.GLOBAL_SYSTEM_ERROR);
    }
  }

  @Transactional
  @Override
  public MemberDetailVO changeRole(String actorId, String targetId, String newRoleId) {
    this.roleAssignPolicy.checkAssignable(actorId, targetId, newRoleId);
    int updatedRows = this.memberDao.updateBaseRole(targetId, newRoleId);
    if (updatedRows == 0) {
      throw new LearningworksException(ErrorCode.USER_NOT_EXISTS);
    }
    return this.memberDao.selectMemberDetail(targetId);
  }

}
