package com.learningworks.member.dao;

import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import com.learningworks.member.vo.request.MemberCreateVO;
import com.learningworks.member.vo.request.MemberSearchVO;
import com.learningworks.member.vo.request.ModifyInfoVO;
import com.learningworks.member.vo.request.ModifyMemberVO;
import com.learningworks.member.vo.response.MemberDetailVO;
import com.learningworks.member.vo.response.MemberListVO;
import com.learningworks.member.vo.response.MemberVO;

@Mapper
public interface MemberDao {

  MemberVO selectLoginMember(String id);

  String selectSalt(String id);

  int updateLoginSuccess(String id);

  int updateLoginFail(@Param("id") String id, @Param("failCount") int failCount,
      @Param("blockDate") LocalDateTime blockDate);

  MemberVO selectLoginFailStateForUpdate(String id);

  int updateMyInfo(@Param("id") String id, @Param("infoVO") ModifyInfoVO infoVO);

  MemberVO selectMyInfo(String id);

  int updatePassword(@Param("id") String id, @Param("password") String password);

  int updateSalt(@Param("id") String id, @Param("salt") String salt,
      @Param("modifierId") String modifierId);

  int insertUser(@Param("member") MemberCreateVO createVO,
      @Param("encryptedPassword") String encryptedPassword);

  int insertSalt(@Param("id") String id, @Param("salt") String salt,
      @Param("creatorId") String creatorId);

  int selectIdCount(String id);

  long selectMemberCount(MemberSearchVO searchVO);

  List<MemberListVO> selectMemberList(MemberSearchVO searchVO);

  MemberDetailVO selectMemberDetail(String id);

  int updateMember(@Param("id") String id, @Param("modifyVO") ModifyMemberVO modifyVO);

  int deleteMember(String id);

  int resetPassword(@Param("id") String id, @Param("password") String password);

  int updateBaseRole(@Param("id") String id, @Param("roleId") String roleId);
}
