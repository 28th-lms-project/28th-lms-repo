import { useCallback, useEffect, useState } from "react";

import { useParams } from "react-router-dom";

import usePermission from "../../../hooks/usePermission";
import Button from "../../common/ui/Button.jsx";
import Field from "../../common/ui/Field.jsx";
import Panel from "../../common/ui/Panel.jsx";
import SelectBox from "../../common/ui/SelectBox.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import Table from "../../common/ui/Table.jsx";
import { useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons";

import {
  getCourseStudentList,
  getInterviewList,
  insertInterview,
} from "../../../api/my/course/interviewApi.js";

const COMPANY_MAX_LENGTH = 200;

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

// "2026-11-20T14:30" → "2026-11-20 14:30" (가이드 8장 날짜 형식)
function formatDateTime(value) {
  if (!value) return "";

  return value.replace("T", " ");
}

// 입력값 검증. 오류가 없으면 빈 객체 반환
function validate(form) {
  const errors = {};

  if (!form.selectedCourseStudentId) {
    errors.selectedCourseStudentId = "수강생을 고르세요.";
  }

  // datetime-local 은 날짜와 시간을 모두 입력해야 값이 채워진다 ("yyyy-MM-ddTHH:mm")
  if (!form.interviewDateTime) {
    errors.interviewDateTime = "면접 날짜와 시간을 모두 고르세요.";
  }

  const company = form.interviewCompany.trim();
  if (!company) {
    errors.interviewCompany = "회사명을 입력하세요.";
  } else if (company.length > COMPANY_MAX_LENGTH) {
    errors.interviewCompany = `회사명은 ${COMPANY_MAX_LENGTH}자 이내로 입력하세요.`;
  }

  return errors;
}

const COLUMNS = [
  { key: "studentName", title: "수강생", width: "20%" },
  { key: "interviewCompany", title: "회사명", ellipsis: true },
  {
    key: "interviewDateTime",
    title: "면접 일시",
    width: "28%",
    mono: true,
    render: (row) => formatDateTime(row.interviewDateTime),
  },
];

export default function MyInterview({ courseId: courseIdProp }) {
  const params = useParams();
  const toast = useToast();

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
  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => {
      if (!previous[name]) return previous;

      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  const handleChange = (event) => {
    setField(event.target.name, event.target.value);
  };

  // 저장
  const handleSave = async (event) => {
    event.preventDefault();
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
      toast.success("면접 일정을 등록했습니다.");
      resetForm();
      setIsRegisterOpen(false);
      setIsLoading(true);
      await loadInterviewList();
    } catch (error) {
      // 실패 시 폼과 입력값 유지. 칸 오류는 칸 아래, 그 밖의 오류는 토스트
      const serverErrors = {};
      let globalMessage = "";

      Object.entries(error?.validations ?? {}).forEach(([field, messages]) => {
        const key = SERVER_FIELD_TO_ERROR_KEY[field];
        if (key) {
          serverErrors[key] = messages?.[0];
        } else if (!globalMessage) {
          globalMessage = messages?.[0];
        }
      });

      if (Object.keys(serverErrors).length === 0 && !globalMessage) {
        globalMessage =
          error instanceof Error
            ? error.message
            : "면접 일정 등록 중 오류가 발생했습니다.";
      }

      setErrors(serverErrors);
      if (globalMessage) toast.error(globalMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // 취소 (API 호출 · 재조회 없음)
  const handleCancel = () => {
    resetForm();
    setIsRegisterOpen(false);
  };

  const studentOptions = studentList.map((student) => ({
    value: String(student.courseStudentId),
    label: student.studentName,
  }));
  const selectedStudent =
    studentOptions.find(
      (option) => option.value === String(form.selectedCourseStudentId),
    ) ?? null;

  return (
    <div className="form-stack">
      <div className="toolbar">
        {!isLoading && !errorMessage && (
          <span className="field-hint">
            면접 일정 {interviewList.length}건
          </span>
        )}

        {canCreate && !isRegisterOpen && (
          <Button
            variant="primary"
            icon={icons.add}
            onClick={handleOpenRegister}
            className="toolbar-end"
          >
            일정 등록
          </Button>
        )}
      </div>

      {/* 일정 등록 폼 */}
      {canCreate && isRegisterOpen && (
        <form onSubmit={handleSave} noValidate>
          <Panel
            title="면접 일정 등록"
            footer={
              <>
                <Button onClick={handleCancel} disabled={isSaving}>
                  취소
                </Button>
                <Button type="submit" variant="primary" loading={isSaving}>
                  {isSaving ? "등록 중..." : "등록"}
                </Button>
              </>
            }
          >
            <div className="form-row">
              <Field
                label="수강생"
                htmlFor="interviewStudent"
                required
                error={errors.selectedCourseStudentId}
              >
                <SelectBox
                  inputId="interviewStudent"
                  options={studentOptions}
                  value={selectedStudent}
                  onChange={(option) =>
                    setField("selectedCourseStudentId", option?.value ?? "")
                  }
                  placeholder="수강생 선택"
                  isDisabled={isSaving}
                  aria-invalid={Boolean(errors.selectedCourseStudentId)}
                />
              </Field>

              <Field
                label="면접 일시"
                htmlFor="interviewDateTime"
                required
                error={errors.interviewDateTime}
              >
                <input
                  id="interviewDateTime"
                  type="datetime-local"
                  name="interviewDateTime"
                  className="form-control"
                  value={form.interviewDateTime}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </Field>

              <Field
                label="회사명"
                htmlFor="interviewCompany"
                required
                error={errors.interviewCompany}
                count={{
                  current: form.interviewCompany.length,
                  max: COMPANY_MAX_LENGTH,
                }}
              >
                <input
                  id="interviewCompany"
                  type="text"
                  name="interviewCompany"
                  className="form-control"
                  placeholder="면접 회사명을 입력하세요."
                  maxLength={COMPANY_MAX_LENGTH}
                  value={form.interviewCompany}
                  onChange={handleChange}
                  disabled={isSaving}
                />
              </Field>
            </div>
          </Panel>
        </form>
      )}

      {/* 면접 일정 표 (조회 중 · 오류 · 빈 목록 포함) */}
      {errorMessage ? (
        <StatusBox type="error" detail={errorMessage} />
      ) : isLoading ? (
        <StatusBox type="loading" title="면접 일정을 불러오는 중..." />
      ) : (
        <Table
          columns={COLUMNS}
          rows={interviewList}
          rowKey="id"
          size="sm"
          ariaLabel="면접 일정"
          emptyText="등록된 면접 일정이 없습니다."
        />
      )}
    </div>
  );
}
