package com.learningworks.member.service;

import java.time.LocalDateTime;
import com.learningworks.member.vo.request.ModifyInfoVO;
import com.learningworks.member.vo.response.MemberVO;

public interface MemberService {

  void increaseLoginFailCount(String id, LocalDateTime now);

  void resetLoginFailCount(String id);

  void verifyPassword(String id, String rawPassword);

  MemberVO updateMyInfo(String id, ModifyInfoVO infoVO);

  MemberVO selectMyInfo(String id);
}
