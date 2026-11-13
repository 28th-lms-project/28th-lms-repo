package com.learningworks.code.vo.response;

import lombok.Data;

/** 다른 화면의 드롭다운용 (USE_YN = 'Y'인 코드만, ORDER 순) */
@Data
public class CodeOptionVO {

	private String id;
	private String name;

}
