package com.learningworks.access.vo.request;

import java.util.List;

import com.learningworks.access.vo.response.AccessVO;

import jakarta.validation.Valid;
import lombok.Data;

@Data
public class AccessSaveRequestVO {

    private List<@Valid AccessVO> addedList;

    private List<@Valid AccessVO> modifiedList;
}
