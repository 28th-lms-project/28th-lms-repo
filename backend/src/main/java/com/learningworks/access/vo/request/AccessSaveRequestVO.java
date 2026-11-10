package com.learningworks.access.vo.request;

import java.util.List;

import com.learningworks.access.vo.response.AccessVO;

import jakarta.validation.Valid;
import jakarta.validation.groups.ConvertGroup;
import jakarta.validation.groups.Default;
import lombok.Data;

@Data
public class AccessSaveRequestVO {

    // 등록: AccessVO.Add 그룹으로 검증 (actionCode 필수)
    private List<@Valid @ConvertGroup(from = Default.class, to = AccessVO.Add.class) AccessVO> addedList;

    private List<@Valid AccessVO> modifiedList;
}
