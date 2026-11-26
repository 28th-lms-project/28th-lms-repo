package com.learningworks.access.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.access.vo.request.AccessSearchRequestVO;
import com.learningworks.access.vo.response.AccessListVO;
import com.learningworks.access.vo.response.AccessVO;

@Mapper
public interface AccessDao {

    // 접근 권한 목록 조회
    List<AccessListVO> selectAccessList(
            AccessSearchRequestVO request
    );

    // 접근 권한 등록
    int insertAccess(AccessVO access);

    // 접근 권한 수정
    int updateAccess(AccessVO access);

    /**
     * 메뉴 이동(소메뉴를 다른 중메뉴로): 그 소메뉴를 가리키는 ACTION의 중 · 대메뉴를 새 경로로 바꾼다.
     * 메뉴 모듈(MenuServiceImpl.moveMenu)이 같은 트랜잭션에서 호출한다 (access-design.md D-10)
     */
    int updateActionMenusByBtmMenuId(@Param("btmMenuId") String btmMenuId,
            @Param("midMenuId") String midMenuId, @Param("topMenuId") String topMenuId);

    /**
     * 메뉴 이동(중메뉴를 다른 대메뉴로): 그 중메뉴를 가리키는 ACTION의 대메뉴를 바꾼다 (D-10)
     */
    int updateActionTopMenuByMidMenuId(@Param("midMenuId") String midMenuId,
            @Param("topMenuId") String topMenuId);
}