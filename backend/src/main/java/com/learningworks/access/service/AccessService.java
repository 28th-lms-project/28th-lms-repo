package com.learningworks.access.service;

import java.util.List;

import com.learningworks.access.vo.request.AccessSaveRequestVO;
import com.learningworks.access.vo.request.AccessSearchRequestVO;
import com.learningworks.access.vo.response.AccessListVO;
import com.learningworks.access.vo.response.AccessMenuVO;

public interface AccessService {

    List<AccessListVO> selectAccessList(
            AccessSearchRequestVO request
    );

    List<AccessMenuVO> selectMenuList();

    void saveAccess(AccessSaveRequestVO request);
}