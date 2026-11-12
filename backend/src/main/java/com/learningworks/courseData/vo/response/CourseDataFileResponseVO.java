package com.learningworks.courseData.vo.response;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 교육 자료 파일 업로드 응답
 */
@Data
@AllArgsConstructor
public class CourseDataFileResponseVO {
	/** 파일 ID (= 서버 저장 파일명, 32자리 16진수 + 확장자) */
	private String fileId;
	/** 원본 파일명 (화면 표시용) */
	private String originalFileName;
	/** 다운로드 경로 (인증 헤더가 필요하므로 프론트에서 Blob 으로 조회) */
	private String downloadUrl;
	/** 파일 크기 (byte) */
	private long fileSize;
	/** 이미지 파일 여부 */
	private boolean image;
}
