package com.learningworks.access.vo.request;

import java.util.List;

import com.learningworks.access.vo.response.AccessVO;

import lombok.Data;

@Data
public class AccessSaveRequestVO {

    private List<AccessVO> addedList;

    private List<AccessVO> modifiedList;
}