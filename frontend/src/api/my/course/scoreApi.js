/**
 * 성적(SCORE) API
 * 백엔드: ScoreController (/scores)
 */
import { api } from "../../common/apiClient.js";

const encode = (value) => encodeURIComponent(value);

/**
 * 내 성적 조회 (이 과정의 공개 시험 + 비공개로 바뀌었지만 내가 응시한 시험)
 * 반환: [{ testSetId, setName, testType, totalPoint, score, pendingCount, averageScore }]
 *       미응시 시험은 score · pendingCount 가 null,
 *       응시자가 없거나 채점 중(R)인 답안이 남아 있는 시험은 averageScore 가 null
 * errorCode: COURSE_NOT_AUTHORIZED (이 과정 수강생이 아님)
 */
export const getMyScoreList = (courseId, options) =>
  api.get(`/scores/${encode(courseId)}/me`, undefined, options);

/**
 * 과정 전체 성적 조회 (강사 · 관리자용, 비공개 시험 포함)
 * 반환: [{ courseStudentId, userId, userName,
 *          scoreList: [{ testSetId, setName, testType, totalPoint, score, pendingCount }] }]
 *       미응시 시험은 score · pendingCount 가 null (averageScore 는 없음)
 * errorCode: COURSE_NOT_AUTHORIZED (관리자가 아니고 이 과정의 강사도 아님)
 *            권한 코드 SCORE_READ_COURSE 가 없으면 403
 */
export const getCourseScoreList = (courseId, options) =>
  api.get(`/scores/${encode(courseId)}`, undefined, options);
