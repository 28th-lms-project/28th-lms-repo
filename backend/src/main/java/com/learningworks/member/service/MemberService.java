package com.learningworks.member.service;

import java.time.LocalDateTime;
import java.util.List;
import com.learningworks.member.vo.request.MemberCreateVO;
import com.learningworks.member.vo.request.MemberSearchVO;
import com.learningworks.member.vo.request.ModifyInfoVO;
import com.learningworks.member.vo.request.ModifyPasswordVO;
import com.learningworks.member.vo.response.MemberDetailVO;
import com.learningworks.member.vo.response.MemberListVO;
import com.learningworks.member.vo.response.MemberVO;

public interface MemberService {

  String createMember(String actorId, MemberCreateVO createVO);

  List<MemberListVO> readMemberList(String actorId, MemberSearchVO searchVO);

  MemberDetailVO readMember(String actorId, String targetId);

  void increaseLoginFailCount(String id, LocalDateTime now);

  void resetLoginFailCount(String id);

  void verifyPassword(String id, String rawPassword);

  MemberVO updateMyInfo(String id, ModifyInfoVO infoVO);

  MemberVO selectMyInfo(String id);

  void updatePassword(String id, ModifyPasswordVO passwordVO);
}
