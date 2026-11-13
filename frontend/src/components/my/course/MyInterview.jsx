import { useCallback, useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import styles from "./MyInterview.module.css";
import usePermission from "../../../hooks/usePermission";
import { Grid } from "../../common/Grid";
import { IconButton } from "../../common/input/IconButton";
import { icons } from "../../common/input/icons";

import {
  getCourseStudentList,
  getInterviewList,
  insertInterview,
} from "../../../api/my/course/interviewApi.js";

const COMPANY_MAX_LENGTH = 200;

const GRID_HEADER = [
  { id: "studentName", title: "수강생" },
  { id: "interviewCompany", title: "회사명" },
  { id: "interviewDateTime", title: "면접일시" },
];

const EMPTY_FORM = {
  selectedCourseStudentId: "",
  interviewDateTime: "",
  interviewCompany: "",
};

// 서버 응답 필드명 → 화면 errors 키
const SERVER_FIELD_TO_ERROR_KEY = {
  courseStudentId: "selectedCourseStudentId",
  interviewDateTime: "interviewDateTime",
  interviewCompany: "interviewCompany",
};

// "2026-11-20 14:30" → "2026.11.20 14:30"
function formatDateTime(value) {
  if (!value) return "";

  return value.replaceAll("-", ".");
}

// 입력값 검증. 오류가 없으면 빈 객체 반환
function validate(form) {
  const errors = {};

  if (!form.selectedCourseStudentId) {
    errors.selectedCourseStudentId = "수강생을 선택해주세요.";
  }

  // datetime-local 은 날짜와 시간을 모두 입력해야 값이 채워진다 ("yyyy-MM-ddTHH:mm")
  if (!form.interviewDateTime) {
    errors.interviewDateTime = "면접 날짜와 시간을 모두 선택해주세요.";
  }

  const company = form.interviewCompany.trim();
  if (!company) {
    errors.interviewCompany = "회사명을 입력해주세요.";
  } else if (company.length > COMPANY_MAX_LENGTH) {
    errors.interviewCompany = `회사명은 ${COMPANY_MAX_LENGTH}자 이내로 입력해주세요.`;
  }

  return errors;
}

export default function MyInterview({ courseId: courseIdProp }) {
  const params = useParams();

  // 부모(MyCourse)에서 받은 courseId 우선, 없으면 URL 파라미터(CourseItem :id) 사용
  const courseId = courseIdProp ?? params?.courseId ?? params?.id;

  // 면접 일정 등록 권한 (InterviewController#createInterview 의 @RequireAction 과 같은 코드)
  const { can } = usePermission();
  const canCreate = can("INTERVIEW_CREATE");

  const [interviewList, setInterviewList] = useState([]);
  const [studentList, setStudentList] = useState([]);

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // 최초 진입 시 바로 조회하므로 courseId 가 있으면 로딩 상태로 시작
  const [isLoading, setIsLoading] = useState(Boolean(courseId));
  const [isSaving, setIsSaving] = useState(false);

  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  const errorMessage = courseId
    ? loadErrorMessage
    : "과정 ID(courseId)를 확인할 수 없습니다.";

  // 면접 일정 목록 조회 (상태 변경은 응답 이후에만 수행)
  const loadInterviewList = useCallback(
    async (options) => {
      try {
        const list = await getInterviewList(courseId, options);
        setInterviewList(list ?? []);
        setLoadErrorMessage("");
      } catch (error) {
        if (error.name === "AbortError") return;

        setInterviewList([]);
        setLoadErrorMessage(
          error instanceof Error
            ? error.message
            : "면접 일정 조회 중 오류가 발생했습니다.",
        );
      } finally {
        if (!options?.signal?.aborted) {
          setIsLoading(false);
        }
      }
    },
    [courseId],
  );

  // 최초 진입 시 면접 일정 목록 조회
  useEffect(() => {
    if (!courseId) return;

    const controller = new AbortController();

    (async () => {
      await loadInterviewList({ signal: controller.signal });
    })();

    return () => controller.abort();
  }, [courseId, loadInterviewList]);

  // 등록 권한이 있을 때만 수강생 목록 조회 (Select Box 용)
  useEffect(() => {
    if (!courseId || !canCreate) return;

    const controller = new AbortController();

    (async () => {
      try {
        const list = await getCourseStudentList(courseId, {
          signal: controller.signal,
        });
        setStudentList(list ?? []);
      } catch (error) {
        if (error.name === "AbortError") return;

        setStudentList([]);
        setLoadErrorMessage(
          error instanceof Error
            ? error.message
            : "수강생 목록 조회 중 오류가 발생했습니다.",
        );
      }
    })();

    return () => controller.abort();
  }, [courseId, canCreate]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
  };

  // 일정 등록 버튼
  const handleOpenRegister = () => {
    resetForm();
    setIsRegisterOpen(true);
  };

  // 입력값 변경 시 해당 항목 오류 제거
  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!previous[name]) return previous;

      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  // 저장
  const handleSave = async () => {
    if (isSaving) return;

    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);

    try {
      await insertInterview(courseId, {
        courseStudentId: form.selectedCourseStudentId,
        interviewDateTime: form.interviewDateTime,
        interviewCompany: form.interviewCompany.trim(),
      });

      // 서버 등록 성공 시에만 폼 닫기 · 초기화 · 재조회
      alert("면접 일정이 등록되었습니다.");
      resetForm();
      setIsRegisterOpen(false);
      setIsLoading(true);
      await loadInterviewList();
    } catch (error) {
      // 실패 시 폼과 입력값 유지, 오류 메시지 표시
      const serverErrors = {};

      Object.entries(error?.validations ?? {}).forEach(([field, messages]) => {
        const key = SERVER_FIELD_TO_ERROR_KEY[field] ?? "global";
        serverErrors[key] = messages?.[0];
      });

      if (Object.keys(serverErrors).length === 0) {
        serverErrors.global =
          error instanceof Error
            ? error.message
            : "면접 일정 등록 중 오류가 발생했습니다.";
      }

      setErrors(serverErrors);
    } finally {
      setIsSaving(false);
    }
  };

  // 취소 (API 호출 · 재조회 없음)
  const handleCancel = () => {
    resetForm();
    setIsRegisterOpen(false);
  };

  const gridContent = interviewList.map((interview) => [
    { id: `${interview.id}_studentName`, value: interview.studentName },
    {
      id: `${interview.id}_interviewCompany`,
      value: interview.interviewCompany,
    },
    {
      id: `${interview.id}_interviewDateTime`,
      value: formatDateTime(interview.interviewDateTime),
    },
  ]);

  const hasInterviews = interviewList.length > 0;

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        <div className={styles.header}>
          {/*<h2 className={styles.title}>면접 일정</h2>*/}

          {canCreate && (
            <IconButton
              icon={icons.add}
              disabled={isRegisterOpen}
              onClick={handleOpenRegister}
            >
              일정 등록
            </IconButton>
          )}
        </div>

        {/* 일정 등록 폼 */}
        {canCreate && isRegisterOpen && (
          <div className={styles.registerForm}>
            <div className={styles.field}>
              <label htmlFor="interviewStudent">수강생</label>
              <select
                id="interviewStudent"
                name="selectedCourseStudentId"
                className={styles.select}
                value={form.selectedCourseStudentId}
                onChange={handleChange}
                disabled={isSaving}
              >
                <option value="">수강생을 선택하세요.</option>
                {studentList.map((student) => (
                  <option
                    key={student.courseStudentId}
                    value={student.courseStudentId}
                  >
                    {student.studentName}
                  </option>
                ))}
              </select>
              {errors.selectedCourseStudentId && (
                <p className={styles.fieldError}>
                  {errors.selectedCourseStudentId}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="interviewDateTime">면접일시</label>
              <input
                id="interviewDateTime"
                type="datetime-local"
                name="interviewDateTime"
                className={styles.dateTime}
                value={form.interviewDateTime}
                onChange={handleChange}
                disabled={isSaving}
              />
              {errors.interviewDateTime && (
                <p className={styles.fieldError}>{errors.interviewDateTime}</p>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="interviewCompany">회사명</label>
              <input
                id="interviewCompany"
                type="text"
                name="interviewCompany"
                className={styles.company}
                placeholder="면접 회사명을 입력하세요."
                maxLength={COMPANY_MAX_LENGTH}
                value={form.interviewCompany}
                onChange={handleChange}
                disabled={isSaving}
              />
              {errors.interviewCompany && (
                <p className={styles.fieldError}>{errors.interviewCompany}</p>
              )}
            </div>

            {errors.global && (
              <p className={styles.fieldError}>{errors.global}</p>
            )}

            <div className={styles.buttons}>
              <IconButton
                icon={icons.ok}
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "저장 중..." : "저장"}
              </IconButton>
              <IconButton
                icon={icons.close}
                disabled={isSaving}
                onClick={handleCancel}
              >
                취소
              </IconButton>
            </div>
          </div>
        )}

        {/* 조회 오류 */}
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {/* 조회 중 */}
        {isLoading && (
          <p className={styles.loading}>면접 일정을 불러오는 중입니다.</p>
        )}

        {/* 면접 일정 그리드 */}
        {!isLoading && hasInterviews && (
          <Grid
            title=""
            header={GRID_HEADER}
            content={gridContent}
            columnStyle="1fr 2fr 1fr"
          />
        )}

        {/* 면접 일정 없음 */}
        {!isLoading && !hasInterviews && !errorMessage && (
          <p className={styles.emptyMessage}>등록된 면접 일정이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
