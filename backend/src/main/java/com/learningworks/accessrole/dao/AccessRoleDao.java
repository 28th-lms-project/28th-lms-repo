package com.learningworks.accessrole.dao;

import com.learningworks.accessrole.vo.request.AccessRoleSaveRequestVO;
import com.learningworks.accessrole.vo.response.AccessRolePermissionVO;
import com.learningworks.accessrole.vo.response.AccessRoleVO;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccessRoleDao {

    // 역할 목록 조회
    List<AccessRoleVO> selectRoleList();

    // 역할별 허용 권한 목록 조회
    List<AccessRolePermissionVO> selectAllowedPermissionList(
            @Param("roleId") String roleId
    );

    // 역할별 미허용 권한 목록 조회
    List<AccessRolePermissionVO> selectDeniedPermissionList(
            @Param("roleId") String roleId
    );

    // 역할 존재 여부 확인
    int selectRoleCount(
            @Param("roleId") String roleId
    );

    // 전체 권한 중 유효한 권한 개수 확인
    int selectActionCount(
            @Param("actionIds") List<String> actionIds
    );

    // 기존 역할 권한 삭제
    int deleteRolePermission(
            @Param("roleId") String roleId
    );

    // 역할 권한 등록
    int insertRolePermission(
            @Param("roleId") String roleId,
            @Param("actionIds") List<String> actionIds
    );
}