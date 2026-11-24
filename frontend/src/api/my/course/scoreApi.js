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
 *          scoreList: [{ testSetId, setName, testType, totalPoint, score, pendingCount, averageScore }] }]
 *       미응시 시험은 score · pendingCount 가 null (시험별 반 평균 averageScore 포함, 채점 중 답안이 있으면 null)
 * errorCode: COURSE_NOT_AUTHORIZED (관리자가 아니고 이 과정의 강사도 아님)
 *            권한 코드 SCORE_READ_COURSE 가 없으면 403
 */
export const getCourseScoreList = (courseId, options) =>
  api.get(`/scores/${encode(courseId)}`, undefined, options);

/**
 * 내 과정 전체 석차 (채점이 끝난 응시 시험의 100점 환산 평균 기준, 동점자 같은 석차)
 * 반환: { averagePercent, testCount, rankNo, rankTotal } 또는 null (석차를 낼 시험이 없음)
 */
export const getMyCourseRank = (courseId, options) =>
  api.get(`/scores/${encode(courseId)}/me/rank`, undefined, options);

/**
 * 내 시험 상세 결과 (문항별 정답 · 내 답안 · 획득 점수)
 * 본인 채점이 모두 끝나고 시험이 마감(비공개)된 뒤에만. 아니면 errorCode SCORE_RESULT_NOT_OPEN (403)
 */
export const getMyScoreDetail = (courseId, testSetId, options) =>
  api.get(
    `/scores/${encode(courseId)}/me/tests/${encode(testSetId)}`,
    undefined,
    options,
  );

/**
 * 수강생 1명이 보는 내 성적 목록 (강사 · 관리자용, 학생 화면과 같은 데이터)
 * 반환: getMyScoreList 와 같음. errorCode: COURSE_NOT_AUTHORIZED, STUDENT_NOT_IN_COURSE
 */
export const getStudentScoreList = (courseId, courseStudentId, options) =>
  api.get(
    `/scores/${encode(courseId)}/students/${encode(courseStudentId)}`,
    undefined,
    options,
  );

/**
 * 수강생 1명의 과정 전체 석차 (강사 · 관리자용). 반환: getMyCourseRank 와 같음
 */
export const getStudentCourseRank = (courseId, courseStudentId, options) =>
  api.get(
    `/scores/${encode(courseId)}/students/${encode(courseStudentId)}/rank`,
    undefined,
    options,
  );

/**
 * 수강생 1명의 시험 1건 상세 성적 (강사 · 관리자용)
 * 반환: { testSetId, setName, testType, userName, submittedAt, totalPoint, score, pendingCount,
 *         items: [{ testId, question, subQuestion, answerType, answerSheet1~5, pointAlloc,
 *                   correctAnswer, answer, isCorrect, earnedPoint }] }
 * errorCode: COURSE_NOT_AUTHORIZED, STUDENT_NOT_IN_COURSE, TEST_SET_NOT_EXISTS
 */
export const getStudentScoreDetail = (courseId, courseStudentId, testSetId, options) =>
  api.get(
    `/scores/${encode(courseId)}/students/${encode(courseStudentId)}/tests/${encode(testSetId)}`,
    undefined,
    options,
  );
