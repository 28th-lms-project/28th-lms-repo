package com.learningworks.accessrole.dao;

import com.learningworks.accessrole.vo.response.AccessRolePermissionVO;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AccessRoleDao {

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

    // 역할 권한 1건 등록. ROLE_ACTION_ID는 시퀀스로 생성 ('RA-YYYYMMDD-000001')
    // INSERT ALL은 NEXTVAL이 원본 행마다 한 번만 증가해 여러 행에 같은 ID가 들어가므로, 한 행씩 등록한다
    int insertRolePermission(
            @Param("roleId") String roleId,
            @Param("actionId") String actionId
    );
}