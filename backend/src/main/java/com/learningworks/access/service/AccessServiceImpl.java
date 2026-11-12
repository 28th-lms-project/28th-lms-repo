package com.learningworks.access.service;

import java.util.List;

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

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AccessServiceImpl implements AccessService {

    private final AccessDao accessDao;

    private final ActionCodeRegistry actionCodeRegistry;

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
}
