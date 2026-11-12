package com.learningworks.courseData.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

import com.learningworks.courseData.vo.request.CourseDataRequestVO;
import com.learningworks.courseData.vo.request.CourseDataSearchRequestVO;
import com.learningworks.courseData.vo.response.CourseDataFileResponseVO;
import com.learningworks.courseData.vo.response.CourseDataListResponseVO;
import com.learningworks.courseData.vo.response.CourseDataResponseVO;

public interface CourseDataService {

	/** 과정의 교육 자료 목록 조회 (자료명 검색, 생성일 내림차순, 서버 페이징) */
	CourseDataListResponseVO getCourseDataList(String courseId, CourseDataSearchRequestVO searchRequestVO);

	/** 교육 자료 상세 조회 */
	CourseDataResponseVO getCourseData(String courseId, String id);

	/** 교육 자료 등록. 생성된 교육 자료 ID 반환 */
	String createCourseData(String courseId, CourseDataRequestVO courseDataRequestVO);

	/** 교육 자료 수정 (현재 과정의 자료만, CRT_DT 유지 · MDFY_DT 갱신) */
	void updateCourseData(String courseId, String id, CourseDataRequestVO courseDataRequestVO);

	/** 교육 자료 삭제 (현재 과정의 자료만, 다른 자료에서 쓰지 않는 첨부 파일은 정리) */
	void deleteCourseData(String courseId, String id);

	/** 과정 ID 형식 · 존재 여부 확인 (없으면 COURSE_NOT_EXISTS) */
	void checkCourse(String courseId);

	/** 교육 자료 파일 업로드 (본문 등록과 분리) */
	CourseDataFileResponseVO uploadFile(String courseId, MultipartFile file);

	/** 교육 자료 파일 조회 (다운로드 · 이미지 표시) */
	Resource loadFile(String courseId, String fileId);

	/** 등록 중 업로드한 임시 파일 삭제 (등록된 교육 자료에서 사용 중인 파일은 삭제 불가) */
	void deleteTemporaryFile(String courseId, String fileId);
}
