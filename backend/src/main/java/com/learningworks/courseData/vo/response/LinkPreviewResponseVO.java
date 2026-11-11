package com.learningworks.courseData.vo.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 링크 미리보기 카드 정보
 * - url: 미리보기를 요청한 원본 URL
 * - title / description: 페이지 제목 · 설명 (없으면 null)
 * - image: 썸네일 이미지 URL (https 만, 없으면 null)
 * - siteName: 사이트 이름 (없으면 호스트명)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LinkPreviewResponseVO {

	private String url;

	private String title;

	private String description;

	private String image;

	private String siteName;
}
