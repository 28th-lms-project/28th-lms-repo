import { Fragment, useCallback, useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import styles from "./MyTimetable.module.css";
import usePermission from "../../../hooks/usePermission";

import {
  getTimetable,
  uploadTimetable,
} from "../../../api/admin/course/timetableApi";

// 오늘 날짜
function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 날짜 표시
function formatDate(date) {
  if (!date) return "";

  return date.replaceAll("-", ".");
}

// API 응답 정규화
// apiClient 가 공통 응답(ApiResponse)의 body 만 반환하므로 그대로 사용
function getResponseData(data) {
  if (!data) {
    throw new Error("시간표 데이터가 존재하지 않습니다.");
  }

  return data;
}

// 교시별 수업 찾기
function getLesson(lessons, slotIndex) {
  return lessons?.find(
    (lesson) => Number(lesson.slotIndex) === Number(slotIndex),
  );
}

export default function MyTimetable({ courseId: courseIdProp }) {
  const params = useParams();

  // 부모(MyCourse / CourseItem)에서 받은 courseId 우선, 없으면 URL 파라미터 사용
  const courseId = courseIdProp ?? params?.courseId ?? params?.id;

  // 시간표 등록 권한 (TimetableController#upload 의 @RequireAction 과 같은 코드)
  // 역할 ID를 직접 비교하지 않고 권한 코드로 판단 → ROLE_STUDENT 등 미부여 역할은 숨김
  const { can } = usePermission();
  const canUpload = can("COURSE_SCHEDULE_CREATE");

  const [timetable, setTimetable] = useState(null);

  const [selectedDate, setSelectedDate] = useState(getLocalDate());

  const [fileName, setFileName] = useState("");

  const [isAllOpen, setIsAllOpen] = useState(true);

  const [isUploading, setIsUploading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  // 선택한 날짜의 시간표
  const todaySchedule = useMemo(() => {
    return timetable?.schedules?.find(
      (schedule) => schedule.date === selectedDate,
    );
  }, [timetable, selectedDate]);

  // 등록된 시간표(날짜) 존재 여부
  const hasSchedules = (timetable?.schedules?.length ?? 0) > 0;

  // 오늘 날짜 (전체 시간표에서 오늘 라인 강조용)
  const todayDate = getLocalDate();

  // 시간표 조회
  const loadTimetable = useCallback(
    async (date = null) => {
      if (!courseId) {
        setErrorMessage("과정 ID(courseId)를 확인할 수 없습니다.");
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await getTimetable(courseId);

        const data = getResponseData(response);

        const schedules = data.schedules ?? [];

        setTimetable({
          ...data,
          timeSlots: data.timeSlots ?? [],
          schedules,
        });

        const today = getLocalDate();

        const targetDate =
          date && schedules.some((schedule) => schedule.date === date)
            ? date
            : schedules.some((schedule) => schedule.date === today)
              ? today
              : (schedules[0]?.date ?? today);

        setSelectedDate(targetDate);
      } catch (error) {
        setTimetable(null);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "시간표 조회 중 오류가 발생했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [courseId],
  );

  // 과정 진입 시 시간표 조회
  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  // 엑셀 업로드
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setErrorMessage("엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.");

      event.target.value = "";
      return;
    }

    if (!courseId) {
      setErrorMessage("URL에서 과정 ID(courseId)를 확인할 수 없습니다.");

      event.target.value = "";
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    setIsUploading(true);
    setErrorMessage("");

    try {
      // 실제 업로드 API 호출
      const response = await uploadTimetable(courseId, formData);

      const data = getResponseData(response);

      const schedules = data.schedules ?? [];

      setTimetable({
        ...data,
        timeSlots: data.timeSlots ?? [],
        schedules,
      });

      setFileName(file.name);

      const today = getLocalDate();

      const targetDate = schedules.some((schedule) => schedule.date === today)
        ? today
        : (schedules[0]?.date ?? today);

      setSelectedDate(targetDate);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "시간표 업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setIsUploading(false);

      // 같은 파일도 다시 선택할 수 있도록 초기화
      event.target.value = "";
    }
  };

  // 날짜 변경
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        {/* 엑셀 업로드 (등록 권한이 있을 때만 표시) */}
        {canUpload && (
          <div className={styles.uploadArea}>
            <label className={styles.fileButton}>
              파일 선택
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </label>

            <span className={styles.fileName}>
              {isUploading ? "업로드 중..." : fileName || "선택된 파일 없음"}
            </span>
          </div>
        )}

        {/* 오류 메시지 */}
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {/* 조회 중 */}
        {isLoading && (
          <p className={styles.loading}>시간표를 불러오는 중입니다.</p>
        )}

        {/* 시간표 데이터 */}
        {!isLoading && hasSchedules && (
          <>
            {/* 날짜 선택 및 일일 시간표 */}
            <div className={styles.dateHeader}>
              <h2 className={styles.dateTitle}>
                {formatDate(selectedDate)}의 시간표
              </h2>

              <select
                className={styles.dateSelect}
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
              >
                {timetable.schedules.map((schedule) => (
                  <option key={schedule.date} value={schedule.date}>
                    {formatDate(schedule.date)}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.tableScroll}>
              <table className={styles.todayTable}>
                <thead>
                  <tr>
                    {timetable.timeSlots.map((slot) => (
                      <th key={slot.slotIndex}>{slot.label}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    {timetable.timeSlots.map((slot) => {
                      const lesson = getLesson(
                        todaySchedule?.lessons,
                        slot.slotIndex,
                      );

                      return (
                        <td
                          key={slot.slotIndex}
                          className={slot.breakTime ? styles.breakCell : ""}
                        >
                          {lesson && (
                            <>
                              <span>{lesson.subject}</span>

                              <span>{lesson.content}</span>
                            </>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>

              {!todaySchedule && (
                <p className={styles.emptyMessage}>
                  해당 날짜에 등록된 시간표가 없습니다.
                </p>
              )}
            </div>

            {/* 전체 시간표 */}
            <div className={styles.allTitle}>
              <h2>전체 시간표</h2>

              <button
                type="button"
                onClick={() => setIsAllOpen((previous) => !previous)}
              >
                [{isAllOpen ? "접기" : "펼치기"}]
              </button>
            </div>

            {isAllOpen && (
              <div className={styles.tableScroll}>
                <table className={styles.allTable}>
                  <thead>
                    <tr>
                      <th rowSpan={2} className={styles.dateColumn}>
                        날짜
                      </th>

                      <th rowSpan={2} className={styles.typeColumn}>
                        구분
                      </th>

                      {timetable.timeSlots.map((slot) => (
                        <th key={slot.slotIndex}>
                          <span>{slot.label}</span>

                          <small>{slot.time}</small>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timetable.schedules.map((schedule) => (
                      <Fragment key={schedule.date}>
                        {/* 과목명 */}
                        <tr
                          className={`${styles.subjectRow} ${
                            schedule.date === todayDate ? styles.todayRow : ""
                          }`}
                        >
                          <th rowSpan={2} className={styles.dateCell}>
                            {formatDate(schedule.date)}
                          </th>
                          <td className={styles.typeCell}>과목명</td>
                          {timetable.timeSlots.map((slot) => (
                            <td key={slot.slotIndex}>
                              {getLesson(schedule.lessons, slot.slotIndex)
                                ?.subject ?? ""}
                            </td>
                          ))}
                        </tr>
                        {/* 교육 내용 */}
                        <tr
                          className={`${styles.contentRow} ${
                            schedule.date === todayDate ? styles.todayRow : ""
                          }`}
                        >
                          <td className={styles.typeCell}>내용</td>
                          {timetable.timeSlots.map((slot) => (
                            <td key={slot.slotIndex}>
                              {getLesson(schedule.lessons, slot.slotIndex)
                                ?.content ?? ""}
                            </td>
                          ))}
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        {/* 등록된 시간표 없음 */}
        {!isLoading && !hasSchedules && !errorMessage && (
          <p className={styles.emptyMessage}>
            {canUpload
              ? "등록된 시간표가 없습니다. 엑셀 파일을 업로드해 주세요."
              : "등록된 시간표가 없습니다."}
          </p>
        )}
      </section>
    </div>
  );
}
