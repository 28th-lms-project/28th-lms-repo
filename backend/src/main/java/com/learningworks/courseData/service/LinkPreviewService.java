package com.learningworks.courseData.service;

import com.learningworks.courseData.vo.response.LinkPreviewResponseVO;

public interface LinkPreviewService {

	/**
	 * 외부 URL 의 미리보기 정보(제목 · 설명 · 썸네일)를 조회한다.
	 * 사설망 · 루프백 등 내부 주소로의 요청은 차단한다 (SSRF 방지).
	 */
	LinkPreviewResponseVO getLinkPreview(String url);
}
