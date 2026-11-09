package com.learningworks.member.service;

import java.time.LocalDateTime;

public interface MemberService {

  void increaseLoginFailCount(String id, LocalDateTime now);

  void resetLoginFailCount(String id);
}
