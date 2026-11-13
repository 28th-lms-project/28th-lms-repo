/**
 * 성적(SCORE) API
 * 백엔드: ScoreController (/scores)
 */
import { api } from "../../common/apiClient.js";

const encode = (value) => encodeURIComponent(value);

/**
 * 내 성적 조회 (이 과정의 공개 시험별)
 * 반환: [{ testSetId, setName, testType, totalPoint, score, pendingCount }]
 *       미응시 시험은 score · pendingCount 가 없음
 * errorCode: COURSE_NOT_AUTHORIZED (이 과정 수강생이 아님)
 */
export const getMyScoreList = (courseId, options) =>
  api.get(`/scores/${encode(courseId)}/me`, undefined, options);
