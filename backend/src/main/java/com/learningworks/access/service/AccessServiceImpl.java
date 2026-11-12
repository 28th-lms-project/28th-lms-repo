package com.learningworks.access.service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.learningworks.access.dao.AccessDao;
import com.learningworks.access.vo.request.AccessSaveRequestVO;
import com.learningworks.access.vo.request.AccessSearchRequestVO;
import com.learningworks.access.vo.response.AccessListVO;
import com.learningworks.access.vo.response.AccessVO;
import com.learningworks.common.action.ActionCodeRegistry;
import com.learningworks.common.exceptions.LearningworksException;
import com.learningworks.common.exceptions.enums.ErrorCode;
import com.learningworks.menu.service.MenuService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccessServiceImpl implements AccessService {

    private final AccessDao accessDao;

    private final ActionCodeRegistry actionCodeRegistry;

    // ACTION의 메뉴 경로 확인 · 잠금 (MENU 테이블은 메뉴 모듈을 통해서만 읽는다)
    private final MenuService menuService;

    @Override
    public List<AccessListVO> selectAccessList(
            AccessSearchRequestVO request
    ) {
        List<AccessListVO> accessList = accessDao.selectAccessList(request);

        // 등록부에 없는 코드(API에서 @RequireAction이 삭제된 권한)는 미사용으로 표시
        for (AccessListVO access : accessList) {
            access.setActionCodeInUse(
                    actionCodeRegistry.contains(access.getActionCode())
            );
        }

        return accessList;
    }

    // 필수값 검증은 AccessVO의 @Valid 검증에서 처리
    @Override
    @Transactional(rollbackFor = Exception.class)
    public void saveAccess(AccessSaveRequestVO request) {

        List<AccessVO> addedList = request.getAddedList();
        List<AccessVO> modifiedList = request.getModifiedList();

        // 메뉴 경로 확인을 먼저 끝낸 뒤 저장한다 (하나라도 틀리면 아무것도 저장하지 않음)
        checkMenuPaths(addedList, modifiedList);

        // 신규 데이터 등록
        if (addedList != null) {
            for (AccessVO access : addedList) {

                // 드롭다운을 거치지 않은 요청 대비: 등록부에 있는 코드만 허용
                if (!actionCodeRegistry.contains(access.getActionCode())) {
                    throw new LearningworksException(
                            ErrorCode.ACTION_CODE_NOT_EXISTS
                    );
                }

                int result;

                try {
                    result = accessDao.insertAccess(access);
                } catch (DuplicateKeyException e) {
                    // ACTION_CODE UNIQUE 제약 위반
                    throw new LearningworksException(
                            ErrorCode.ACTION_CODE_USED
                    );
                }

                if (result != 1) {
                    throw new LearningworksException(
                            ErrorCode.ACTION_FAILURE_SAVE
                    );
                }
            }
        }

        // 기존 데이터 수정
        if (modifiedList != null) {
            for (AccessVO access : modifiedList) {

                if (!StringUtils.hasText(access.getActionId())) {
                    throw new LearningworksException(
                            ErrorCode.GLOBAL_BAD_REQUEST
                    );
                }

                int result = accessDao.updateAccess(access);

                // 수정된 행이 없으면 대상 ACTION이 없는 것
                if (result == 0) {
                    throw new LearningworksException(
                            ErrorCode.ACTION_NOT_EXISTS
                    );
                }
            }
        }
    }

    /**
     * 저장할 ACTION의 메뉴가 대메뉴 > 중메뉴 > 소메뉴로 이어지는지 확인하고, 소메뉴 행을 잠근다.
     * - MENU · ACTION 사이에 FK가 없으므로, 없는 메뉴나 계층이 맞지 않는 조합을 여기서 막는다
     * - 잠금은 이 트랜잭션이 끝날 때까지 유지된다. 메뉴 삭제도 같은 행을 잠그므로,
     *   삭제 검사(MENU_IN_USE)와 이 저장이 동시에 일어나도 없는 메뉴를 가리키는 ACTION이 생기지 않는다
     * - 여러 요청이 서로 다른 순서로 잠가 교착 상태가 되지 않도록, 소메뉴 ID 순서로 잠근다
     */
    private void checkMenuPaths(List<AccessVO> addedList, List<AccessVO> modifiedList) {
        List<AccessVO> accessList = new ArrayList<>();
        if (addedList != null) {
            accessList.addAll(addedList);
        }
        if (modifiedList != null) {
            accessList.addAll(modifiedList);
        }

        // key: 소메뉴 ID (정렬), value: 확인할 경로들 (같은 경로는 한 번만)
        Map<String, Set<List<String>>> pathsByBtmMenuId = new TreeMap<>();
        for (AccessVO access : accessList) {
            if (access.getBtmMenuId() == null) {
                throw new LearningworksException(ErrorCode.ACTION_MENU_INVALID);
            }
            pathsByBtmMenuId
                    .computeIfAbsent(access.getBtmMenuId(), key -> new LinkedHashSet<>())
                    .add(Arrays.asList(access.getTopMenuId(), access.getMidMenuId(), access.getBtmMenuId()));
        }

        for (Set<List<String>> paths : pathsByBtmMenuId.values()) {
            for (List<String> path : paths) {
                if (!menuService.checkAndLockMenuPath(path.get(0), path.get(1), path.get(2))) {
                    throw new LearningworksException(ErrorCode.ACTION_MENU_INVALID);
                }
            }
        }
    }
}
