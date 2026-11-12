package com.learningworks.courseData.dao;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.learningworks.courseData.vo.request.CourseDataRequestVO;
import com.learningworks.courseData.vo.request.CourseDataSearchRequestVO;
import com.learningworks.courseData.vo.response.CourseDataResponseVO;

@Mapper
public interface CourseDataDao {

	/** 교육 자료 목록 (생성일 내림차순, 페이징) */
	List<CourseDataResponseVO> selectCourseDataList(CourseDataSearchRequestVO searchRequestVO);

	/** 교육 자료 전체 건수 (검색 조건 적용) */
	long countCourseData(CourseDataSearchRequestVO searchRequestVO);

	/** 교육 자료 상세 (과정 ID 조건 포함) */
	CourseDataResponseVO selectCourseData(@Param("courseId") String courseId,
	                                      @Param("id") String id);

	/** 교육 자료 등록 */
	int insertCourseData(CourseDataRequestVO courseDataRequestVO);

	/** 교육 자료 수정 (ID + 과정 ID 조건, MDFY_DT 갱신 · CRT_DT 유지) */
	int updateCourseData(CourseDataRequestVO courseDataRequestVO);

	/** 교육 자료 삭제 (ID + 과정 ID 조건) */
	int deleteCourseData(@Param("courseId") String courseId,
	                     @Param("id") String id);

	/** 과정 존재 여부 */
	int countCourse(String courseId);

	/** 과정의 교육 자료 본문 중 해당 파일을 참조하는 자료 수 */
	int countFileReference(@Param("courseId") String courseId,
	                       @Param("fileId") String fileId);
}
