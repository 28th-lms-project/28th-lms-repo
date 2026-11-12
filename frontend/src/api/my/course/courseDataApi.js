/**
 * 교육 자료(COURSE_DATA) API
 * 백엔드: CourseDataController (/course-data)
 */
import { api } from "../../common/apiClient.js";

const encode = (value) => encodeURIComponent(value);

/**
 * 교육 자료 목록 조회 (자료명 검색 + 서버 페이징)
 * params: { dataName, page(1부터), size }
 * 반환: { list, totalCount, page, size, totalPages }
 */
export const getCourseDataList = (courseId, params, options) =>
  api.get(`/course-data/${encode(courseId)}`, params, options);

/**
 * 교육 자료 상세 조회
 * 반환: { id, courseId, dataName, crtDt, mdfyDt, content }
 * errorCode: COURSE_DATA_NOT_EXISTS
 */
export const getCourseDataDetail = (courseId, id, options) =>
  api.get(`/course-data/${encode(courseId)}/${encode(id)}`, undefined, options);

/**
 * 교육 자료 등록
 * data: { dataName, content }
 * 반환: 생성된 교육 자료 ID
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), COURSE_DATA_EMPTY_CONTENT
 */
export const insertCourseData = (courseId, data) =>
  api.post(`/course-data/${encode(courseId)}`, data);

/**
 * 교육 자료 수정
 * data: { dataName, content }
 * errorCode: GLOBAL_INVALID_PARAMETER(validations), COURSE_DATA_EMPTY_CONTENT,
 *            COURSE_DATA_NOT_EXISTS(다른 과정의 자료 포함), COURSE_DATA_FAILURE_UPDATE
 */
export const updateCourseData = (courseId, id, data) =>
  api.put(`/course-data/${encode(courseId)}/${encode(id)}`, data);

/**
 * 교육 자료 삭제 (다른 자료에서 사용하지 않는 첨부 파일은 서버에서 함께 정리)
 * errorCode: COURSE_DATA_NOT_EXISTS(다른 과정의 자료 포함), COURSE_DATA_FAILURE_DELETE
 */
export const deleteCourseData = (courseId, id) =>
  api.delete(`/course-data/${encode(courseId)}/${encode(id)}`);

/**
 * 링크 미리보기 카드 정보 (서버에서 조회, 내부망 주소는 차단)
 * 반환: { url, title, description, image, siteName }
 * errorCode: LINK_PREVIEW_INVALID_URL, LINK_PREVIEW_FAILURE
 */
export const getLinkPreview = (courseId, url, options) =>
  api.get(`/course-data/${encode(courseId)}/link-preview`, { url }, options);

/**
 * 교육 자료 파일 업로드 (multipart/form-data)
 * 반환: { fileId, originalFileName, downloadUrl, fileSize, image }
 * errorCode: FILES_NOT_ALLOWED_EXTENSION, FILES_INVALID_CONTENT, FILES_TOO_LARGE
 */
export const uploadCourseDataFile = (courseId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/course-data/${encode(courseId)}/files`, formData);
};

/**
 * 등록 중 업로드한 임시 파일 삭제
 * errorCode: FILES_IN_USE (등록된 교육 자료에서 사용 중)
 */
export const deleteCourseDataFile = (courseId, fileId) =>
  api.delete(`/course-data/${encode(courseId)}/files/${encode(fileId)}`);

/** 교육 자료 파일 조회 → Blob (이미지 표시 · 첨부 파일 다운로드) */
export const downloadCourseDataFile = (courseId, fileId, options) =>
  api.download(
    `/course-data/${encode(courseId)}/files/${encode(fileId)}`,
    undefined,
    options,
  );
