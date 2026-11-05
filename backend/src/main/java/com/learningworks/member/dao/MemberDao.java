package com.learningworks.member.dao;

import org.apache.ibatis.annotations.Mapper;
import com.learningworks.member.vo.response.MemberVO;

@Mapper
public interface MemberDao {

  MemberVO selectLoginMember(String id);
}
