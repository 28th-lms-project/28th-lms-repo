import { useEffect, useRef, useState } from "react";

import styles from "./CourseList.module.css";
import usePermission from "../../../../hooks/usePermission";
import Button from "../../../common/ui/Button.jsx";
import Field from "../../../common/ui/Field.jsx";
import Modal from "../../../common/ui/Modal.jsx";
import StatusBox from "../../../common/ui/StatusBox.jsx";
import Table from "../../../common/ui/Table.jsx";
import { useConfirm, useToast } from "../../../common/ui/feedbackContext.js";
import { icons } from "../../../common/input/icons";

import {
  deleteCourse,
  searchCourses,
  updateCourse,
} from "../../../../api/admin/course/courseApi";

const SEARCH_DEBOUNCE_MS = 300;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// 검색 조건 (DB 컬럼: NO · COURSE_NAME · START_DATE · END_DATED)
const EMPTY_FILTER = { no: "", courseName: "", startDate: "", endDated: "" };

// 기수(NO)는 NUMBER 컬럼이라 숫자만 입력받는다
const onlyDigits = (value) => value.replace(/\D/g, "");

// 입력값 검증 실패면 필드별 메시지를, 아니면 서버 에러 메시지를 반환
const getErrorMessage = (error) =>
  error.validations
    ? Object.values(error.validations).flat().join("\n")
    : error.message;

// 공백을 정리한 검색 조건 (빈 조건은 apiClient 가 쿼리스트링에서 뺀다)
const toQuery = (filter) => ({
  no: filter.no.trim(),
  courseName: filter.courseName.trim(),
  startDate: filter.startDate,
  endDated: filter.endDated,
});

const isSameQuery = (a, b) =>
  a.no === b.no &&
  a.courseName === b.courseName &&
  a.startDate === b.startDate &&
  a.endDated === b.endDated;

/** 수정 폼 검증. 칸별 오류 메시지 객체를 반환 (없으면 빈 객체) */
const validateCourse = (form) => {
  const errors = {};

  if (!form.no.trim()) {
    errors.no = "과정 기수를 입력하세요.";
  } else if (!/^\d+$/.test(form.no.trim())) {
    errors.no = "과정 기수는 숫자로 입력하세요.";
  }
  if (!form.courseName.trim()) {
    errors.courseName = "과정 명을 입력하세요.";
  }
  if (!form.startDate) {
    errors.startDate = "과정 시작일을 입력하세요.";
  } else if (!DATE_PATTERN.test(form.startDate)) {
    errors.startDate = "과정 시작일은 yyyy-MM-dd 형식으로 입력하세요.";
  }
  if (!form.endDated) {
    errors.endDated = "과정 종료일을 입력하세요.";
  } else if (!DATE_PATTERN.test(form.endDated)) {
    errors.endDated = "과정 종료일은 yyyy-MM-dd 형식으로 입력하세요.";
  }

  return errors;
};

/**
 * 과정 목록 (관리자)
 * 검색 조건을 바꾸면 조회 버튼 없이 바로 다시 조회한다. 수정은 모달, 삭제는 확인 창 후 DEL_YN = 'Y'.
 */
export default function CourseList() {
  const toast = useToast();
  const confirm = useConfirm();

  // 과정 권한 (CourseController 의 @RequireAction 과 같은 코드)
  const { can } = usePermission();
  const canUpdate = can("COURSE_UPDATE");
  const canDelete = can("COURSE_DELETE");

  // 목록
  const [courseList, setCourseList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  // 검색 입력값과 실제 조회 조건(Debounce 적용 후)
  const [filter, setFilter] = useState(EMPTY_FILTER);
  const [query, setQuery] = useState(EMPTY_FILTER);
  const [reloadKey, setReloadKey] = useState(0);

  // 수정 (editingCourse 가 있으면 수정 모달 열림)
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(EMPTY_FILTER);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);

  // 삭제 (중복 요청 방지)
  const deletingRef = useRef(false);

  // 검색 입력 Debounce → 조회 조건 변경 (다른 조건 값은 그대로 유지)
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = toQuery(filter);
      setQuery((previous) => (isSameQuery(previous, next) ? previous : next));
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [filter]);

  // 목록 조회. 조건이 바뀌면 이전 요청을 취소하여 늦게 도착한 응답이 최신 결과를 덮어쓰지 않게 한다
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const result = await searchCourses(query, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        setCourseList(result ?? []);
        setLoadErrorMessage("");
      } catch (error) {
        if (error.name === "AbortError") return;

        setCourseList([]);
        setLoadErrorMessage(getErrorMessage(error));
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [query, reloadKey]);

  const reloadList = () => setReloadKey((key) => key + 1);

  const changeFilter = (key, value) =>
    setFilter((previous) => ({ ...previous, [key]: value }));

  const resetFilter = () => setFilter(EMPTY_FILTER);

  const hasFilter = Object.values(filter).some((value) => value !== "");

  // ------------------------------------------------------------------
  // 수정
  // ------------------------------------------------------------------
  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      no: String(course.no ?? ""),
      courseName: course.courseName ?? "",
      startDate: course.startDate ?? "",
      endDated: course.endDated ?? "",
    });
    setErrors({});
  };

  const closeEdit = () => {
    if (savingRef.current) return;
    setEditingCourse(null);
    setErrors({});
  };

  const changeForm = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) {
      setErrors((previous) => {
        const next = { ...previous };
        delete next[key];
        return next;
      });
    }
  };

  const saveCourse = async () => {
    // 중복 요청 방지 (state 반영 전 연속 클릭도 차단)
    if (!editingCourse || savingRef.current) return;

    const validationErrors = validateCourse(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    savingRef.current = true;
    setIsSaving(true);
    try {
      await updateCourse(editingCourse.id, {
        no: form.no.trim(),
        courseName: form.courseName.trim(),
        startDate: form.startDate,
        endDated: form.endDated,
      });

      toast.success("과정을 저장했습니다.");
      savingRef.current = false;
      setEditingCourse(null);
      // 기존 검색 조건 그대로 재조회
      reloadList();
    } catch (error) {
      // 서버 검증 오류는 칸 아래, 그 밖의 실패는 토스트 (입력값은 유지)
      const fieldErrors = {};
      Object.entries(error?.validations ?? {}).forEach(([field, messages]) => {
        if (field in EMPTY_FILTER) fieldErrors[field] = messages?.[0];
      });
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      } else {
        toast.error(`과정을 저장하지 못했습니다. ${error.message}`);
      }
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // ------------------------------------------------------------------
  // 삭제: 확인 창에서 [삭제]를 눌렀을 때만 API 호출
  // ------------------------------------------------------------------
  const removeCourse = async (course) => {
    if (deletingRef.current) return;

    const confirmed = await confirm({
      title: "과정 삭제",
      message: `${course.no}기 ${course.courseName} 과정을 삭제할까요?`,
      confirmText: "삭제",
      danger: true,
    });
    if (!confirmed) return;

    deletingRef.current = true;
    try {
      await deleteCourse(course.id);
      toast.success("과정을 삭제했습니다.");
      reloadList();
    } catch (error) {
      toast.error(`과정을 삭제하지 못했습니다. ${error.message}`);
    } finally {
      deletingRef.current = false;
    }
  };

  // 표 칸 구성 (수정 · 삭제 칸은 권한이 있을 때만)
  const columns = [
    {
      key: "rowNumber",
      title: "No.",
      width: "72px",
      align: "num",
      render: (_row, index) => index + 1,
    },
    { key: "no", title: "기수", width: "96px", align: "num" },
    { key: "courseName", title: "강좌명", ellipsis: true },
    { key: "startDate", title: "시작일", width: "140px", mono: true },
    { key: "endDated", title: "종료일", width: "140px", mono: true },
    canUpdate && {
      key: "edit",
      title: "수정",
      width: "96px",
      align: "center",
      render: (row) => (
        <Button
          size="sm"
          icon={icons.edit}
          disabled={editingCourse?.id === row.id}
          onClick={() => openEdit(row)}
        >
          수정
        </Button>
      ),
    },
    canDelete && {
      key: "delete",
      title: "삭제",
      width: "96px",
      align: "center",
      render: (row) => (
        <Button
          size="sm"
          variant="danger"
          icon={icons.delete}
          onClick={() => removeCourse(row)}
        >
          삭제
        </Button>
      ),
    },
  ].filter(Boolean);

  return (
    <div className="form-stack">
      {/* 검색 영역: 조회 버튼 없이 입력값이 바뀌면 바로 조회 */}
      <div className="toolbar">
        <div className={`form-row ${styles.filters}`}>
          <Field label="기수" htmlFor="courseSearchNo">
            <input
              id="courseSearchNo"
              type="text"
              inputMode="numeric"
              className="form-control"
              placeholder="기수"
              value={filter.no}
              onChange={(event) =>
                changeFilter("no", onlyDigits(event.target.value))
              }
            />
          </Field>
          <Field label="강좌명" htmlFor="courseSearchName">
            <input
              id="courseSearchName"
              type="search"
              className="form-control"
              placeholder="강좌명을 입력하세요."
              value={filter.courseName}
              onChange={(event) =>
                changeFilter("courseName", event.target.value)
              }
            />
          </Field>
          <Field label="시작일" htmlFor="courseSearchStartDate">
            <input
              id="courseSearchStartDate"
              type="date"
              className="form-control"
              value={filter.startDate}
              onChange={(event) =>
                changeFilter("startDate", event.target.value)
              }
            />
          </Field>
          <Field label="종료일" htmlFor="courseSearchEndDated">
            <input
              id="courseSearchEndDated"
              type="date"
              className="form-control"
              value={filter.endDated}
              onChange={(event) => changeFilter("endDated", event.target.value)}
            />
          </Field>
          <Button disabled={!hasFilter} onClick={resetFilter}>
            초기화
          </Button>
        </div>
      </div>

      {/* 조회 오류 · 표 */}
      {loadErrorMessage ? (
        <StatusBox
          type="error"
          detail={loadErrorMessage}
          onRetry={reloadList}
        />
      ) : (
        <div>
          <Table
            columns={columns}
            rows={courseList}
            rowKey="id"
            selectedKey={editingCourse?.id}
            loading={isLoading}
            ariaLabel="과정 목록"
            emptyText={
              hasFilter ? "검색 결과가 없습니다." : "등록된 과정이 없습니다."
            }
          />
          <div className="table-footer">
            <span className="field-hint">전체 {courseList.length}건</span>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      <Modal
        open={Boolean(editingCourse)}
        onClose={closeEdit}
        title="과정 수정"
        onSubmit={saveCourse}
        dismissible={!isSaving}
        footer={
          <>
            <Button onClick={closeEdit} disabled={isSaving}>
              취소
            </Button>
            <Button type="submit" variant="primary" loading={isSaving}>
              {isSaving ? "저장 중..." : "저장"}
            </Button>
          </>
        }
      >
        <div className="form-stack">
          <Field label="기수" htmlFor="courseEditNo" required error={errors.no}>
            <input
              id="courseEditNo"
              type="text"
              inputMode="numeric"
              className="form-control"
              placeholder="기수를 입력하세요."
              value={form.no}
              onChange={(event) =>
                changeForm("no", onlyDigits(event.target.value))
              }
              disabled={isSaving}
            />
          </Field>
          <Field
            label="강좌명"
            htmlFor="courseEditName"
            required
            error={errors.courseName}
          >
            <input
              id="courseEditName"
              type="text"
              className="form-control"
              placeholder="강좌명을 입력하세요."
              value={form.courseName}
              onChange={(event) => changeForm("courseName", event.target.value)}
              disabled={isSaving}
            />
          </Field>
          <div className="form-row">
            <Field
              label="시작일"
              htmlFor="courseEditStartDate"
              required
              error={errors.startDate}
            >
              <input
                id="courseEditStartDate"
                type="date"
                className="form-control"
                value={form.startDate}
                onChange={(event) =>
                  changeForm("startDate", event.target.value)
                }
                disabled={isSaving}
              />
            </Field>
            <Field
              label="종료일"
              htmlFor="courseEditEndDated"
              required
              error={errors.endDated}
            >
              <input
                id="courseEditEndDated"
                type="date"
                className="form-control"
                value={form.endDated}
                onChange={(event) => changeForm("endDated", event.target.value)}
                disabled={isSaving}
              />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
