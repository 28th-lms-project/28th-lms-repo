/**
 * 성적(SCORE) API
 * 백엔드: ScoreController (/scores)
 */
import { api } from "../../common/apiClient.js";

const encode = (value) => encodeURIComponent(value);

/**
 * 내 성적 조회 (이 과정의 공개 시험별)
 * 반환: [{ testSetId, setName, testType, totalPoint, score, pendingCount, averageScore }]
 *       미응시 시험은 score · pendingCount 가 null,
 *       응시자가 없거나 채점 중(R)인 답안이 남아 있는 시험은 averageScore 가 null
 * errorCode: COURSE_NOT_AUTHORIZED (이 과정 수강생이 아님)
 */
export const getMyScoreList = (courseId, options) =>
  api.get(`/scores/${encode(courseId)}/me`, undefined, options);
