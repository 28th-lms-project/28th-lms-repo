package com.learningworks.access.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.learningworks.access.vo.request.AccessSearchRequestVO;
import com.learningworks.access.vo.response.AccessListVO;
import com.learningworks.access.vo.response.AccessMenuVO;
import com.learningworks.access.vo.response.AccessVO;

@Mapper
public interface AccessDao {

    // 접근 권한 목록 조회
    List<AccessListVO> selectAccessList(
            AccessSearchRequestVO request
    );

    // 전체 메뉴 목록 조회
    List<AccessMenuVO> selectMenuList();

    // 접근 권한 등록
    int insertAccess(AccessVO access);

    // 접근 권한 수정
    int updateAccess(AccessVO access);
}