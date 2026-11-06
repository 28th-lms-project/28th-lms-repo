package com.learningworks.member.dao;

import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.member.vo.response.MemberVO;

@Mapper
public interface MemberDao {

  MemberVO selectLoginMember(String id);

  String selectSalt(String id);

  int updateLoginSuccess(String id);

  int updateLoginFail(@Param("id") String id, @Param("failCount") int failCount,
      @Param("blockDate") LocalDateTime blockDate);

  MemberVO selectLoginFailStateForUpdate(String id);
}
