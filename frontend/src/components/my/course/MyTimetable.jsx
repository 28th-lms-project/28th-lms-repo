import { useCallback, useEffect, useMemo, useState } from "react";

import { useParams } from "react-router-dom";

import styles from "./MyTimetable.module.css";
import usePermission from "../../../hooks/usePermission";
import Badge from "../../common/ui/Badge.jsx";
import Button from "../../common/ui/Button.jsx";
import FilePicker from "../../common/ui/FilePicker.jsx";
import Panel from "../../common/ui/Panel.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import Table from "../../common/ui/Table.jsx";
import { useToast } from "../../common/ui/feedbackContext.js";

import {
  getTimetable,
  uploadTimetable,
} from "../../../api/my/course/timetableApi.js";

// 오늘 날짜
function getLocalDate() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

// 하루 시간표: 교시마다 한 줄 (쉬는 시간 줄은 is-break)
const DAY_COLUMNS = [
  { key: "label", title: "교시", width: "12%", align: "center" },
  { key: "time", title: "시간", width: "14%", align: "center", mono: true },
  { key: "subject", title: "과목", width: "28%" },
  { key: "content", title: "내용" },
];

export default function MyTimetable({ courseId: courseIdProp }) {
  const params = useParams();
  const toast = useToast();

  // courseId prop이 있으면 우선 (지금은 넘기는 화면 없음), 없으면 URL 파라미터(CourseItem :id) 사용
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

  // 엑셀 업로드 (FilePicker 가 같은 파일을 다시 고를 수 있도록 input 을 비워 줌)
  const handleFileSelect = async (files) => {
    const file = files?.[0];

    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      toast.error("엑셀 파일(.xlsx, .xls)만 업로드할 수 있습니다.");
      return;
    }

    if (!courseId) {
      toast.error("URL에서 과정 ID(courseId)를 확인할 수 없습니다.");
      return;
    }

    const formData = new FormData();

    formData.append("file", file);

    setIsUploading(true);

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
      setErrorMessage("");

      setFileName(file.name);

      const today = getLocalDate();

      const targetDate = schedules.some((schedule) => schedule.date === today)
        ? today
        : (schedules[0]?.date ?? today);

      setSelectedDate(targetDate);
      toast.success("시간표를 업로드했습니다.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "시간표 업로드 중 오류가 발생했습니다.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // 날짜 변경
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // 하루 시간표 행
  const dayRows = (timetable?.timeSlots ?? []).map((slot) => {
    const lesson = getLesson(todaySchedule?.lessons, slot.slotIndex);

    return {
      slotIndex: slot.slotIndex,
      label: slot.label,
      time: slot.time,
      breakTime: slot.breakTime,
      subject: lesson?.subject ?? "",
      content: lesson?.content ?? "",
    };
  });

  return (
    <div className="form-stack">
      {/* 엑셀 업로드 (등록 권한이 있을 때만 표시) */}
      {canUpload && (
        <div className="toolbar">
          <FilePicker
            accept=".xlsx,.xls"
            onSelect={handleFileSelect}
            disabled={isUploading}
            fileName={
              isUploading ? "업로드 중..." : fileName || "선택한 파일 없음"
            }
          />
          <span className="field-hint">
            엑셀 파일(.xlsx, .xls) · 과정 기간 안의 날짜만 올릴 수 있습니다
          </span>
        </div>
      )}

      {/* 조회 오류 · 조회 중 */}
      {errorMessage ? (
        <StatusBox
          type="error"
          detail={errorMessage}
          onRetry={courseId ? () => loadTimetable(selectedDate) : undefined}
        />
      ) : isLoading ? (
        <StatusBox type="loading" title="시간표를 불러오는 중..." />
      ) : !hasSchedules ? (
        /* 등록된 시간표 없음 */
        <StatusBox
          type="empty"
          title="등록된 시간표가 없습니다."
          detail={canUpload ? "엑셀 파일을 업로드하세요." : undefined}
        />
      ) : (
        <>
          {/* 날짜 선택 및 하루 시간표 */}
          <Panel
            title={`${selectedDate} 시간표`}
            badge={
              selectedDate === todayDate ? (
                <Badge tone="success">오늘</Badge>
              ) : undefined
            }
            flush
            actions={
              <select
                className="form-control form-control-sm"
                aria-label="날짜 선택"
                value={selectedDate}
                onChange={(event) => handleDateChange(event.target.value)}
              >
                {timetable.schedules.map((schedule) => (
                  <option key={schedule.date} value={schedule.date}>
                    {schedule.date}
                  </option>
                ))}
              </select>
            }
          >
            {todaySchedule ? (
              <Table
                columns={DAY_COLUMNS}
                rows={dayRows}
                rowKey="slotIndex"
                rowClassName={(row) => (row.breakTime ? "is-break" : undefined)}
                bordered
                size="sm"
                ariaLabel={`${selectedDate} 시간표`}
              />
            ) : (
              <StatusBox
                type="empty"
                size="sm"
                title="해당 날짜에 등록된 시간표가 없습니다."
              />
            )}
          </Panel>

          {/* 전체 시간표: 날짜마다 과목 줄 · 내용 줄 */}
          <Panel
            title="전체 시간표"
            subtitle={`${timetable.schedules.length}일`}
            flush
            actions={
              <Button
                size="sm"
                variant="text"
                aria-expanded={isAllOpen}
                onClick={() => setIsAllOpen((previous) => !previous)}
              >
                {isAllOpen ? "접기" : "펼치기"}
              </Button>
            }
          >
            {isAllOpen && (
              <div className="table-wrap">
                <table
                  className={`table table-bordered table-sm ${styles.allTable}`}
                >
                  <caption className="visually-hidden">전체 시간표</caption>
                  <thead>
                    <tr>
                      <th scope="col" className={styles.dateColumn}>
                        날짜
                      </th>
                      {timetable.timeSlots.map((slot) => (
                        <th
                          key={slot.slotIndex}
                          scope="col"
                          className="col-center"
                        >
                          {slot.label}
                          <br />
                          <span className="field-hint">{slot.time}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {timetable.schedules.map((schedule) => {
                    const isToday = schedule.date === todayDate;

                    return (
                      <tbody key={schedule.date}>
                        {[0, 1].map((row) => (
                          <tr
                            key={row}
                            className={isToday ? "is-highlight" : undefined}
                          >
                            {row === 0 && (
                              <th scope="rowgroup" rowSpan={2}>
                                {schedule.date}
                                {isToday && (
                                  <>
                                    {" "}
                                    <Badge tone="success">오늘</Badge>
                                  </>
                                )}
                              </th>
                            )}

                            {timetable.timeSlots.map((slot) => {
                              const lesson = getLesson(
                                schedule.lessons,
                                slot.slotIndex,
                              );

                              // 쉬는 시간: 두 줄을 합쳐 흐린 글자
                              if (slot.breakTime) {
                                return row === 0 ? (
                                  <td
                                    key={slot.slotIndex}
                                    rowSpan={2}
                                    className="col-center field-hint"
                                  >
                                    {lesson?.subject || slot.label}
                                  </td>
                                ) : null;
                              }

                              return (
                                <td
                                  key={slot.slotIndex}
                                  className={
                                    row === 0 ? undefined : "field-hint"
                                  }
                                  style={
                                    row === 0 ? { fontWeight: 600 } : undefined
                                  }
                                >
                                  {(row === 0
                                    ? lesson?.subject
                                    : lesson?.content) ?? ""}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    );
                  })}
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
