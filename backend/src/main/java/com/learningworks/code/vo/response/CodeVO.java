package com.learningworks.code.vo.response;

import java.time.LocalDateTime;

import lombok.Data;

@Data
public class CodeVO {

	private String id;
	private String name;
	private LocalDateTime crtDt;
	private LocalDateTime mdfyDt;
	private String parentId;
	private Integer order;
	private String useYn;

}
