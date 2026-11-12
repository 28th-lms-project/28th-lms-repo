import {useEffect, useRef, useState} from "react";

import {useParams} from "react-router-dom";

import styles from "./MyCourseData.module.css";
import usePermission from "../../../hooks/usePermission";
import Editor from "../../common/Editor";
import "../../common/editor/editorContent.css";
import {Grid} from "../../common/Grid";
import {Paginator} from "../../common/Paginator";
import {IconButton} from "../../common/input/IconButton";
import {icons} from "../../common/input/icons";

import {
  deleteCourseData,
  deleteCourseDataFile,
  downloadCourseDataFile,
  getCourseDataDetail,
  getCourseDataList,
  getLinkPreview,
  insertCourseData,
  updateCourseData,
  uploadCourseDataFile,
} from "../../../api/my/course/courseDataApi.js";

const PAGE_SIZE = 20;
const PAGE_GROUP_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;
const DATA_NAME_MAX_LENGTH = 200;
const TOAST_DURATION_MS = 2500;
const DELETE_CONFIRM_MESSAGE = "해당 교육 자료를 삭제하시겠습니까?";

const BASE_GRID_HEADER = [
  { id: "rowNumber", title: "번호" },
  { id: "dataName", title: "자료 명" },
  { id: "crtDt", title: "생성일" },
  { id: "mdfyDt", title: "수정일" },
];

// "2026-11-20 14:30" → "2026.11.20 14:30"
const formatDateTime = (value) => (value ? value.replaceAll("-", ".") : "");

/** 객체에서 key 하나를 제외한 새 객체 */
const omitKey = (object, key) => {
  const next = { ...object };
  delete next[key];
  return next;
};

/** Blob 을 파일로 저장 */
const saveBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** 본문 HTML 의 첨부 파일 ID 목록 (DOMParser 는 스크립트를 실행하지 않음) */
const extractFileIds = (html) =>
  Array.from(
    new DOMParser()
      .parseFromString(html ?? "", "text/html")
      .querySelectorAll("[data-file-id]"),
  ).map((element) => element.getAttribute("data-file-id"));

/** 업로드한 임시 파일 정리 (실패해도 화면 흐름에는 영향 없음) */
const deleteTemporaryFiles = (courseId, fileIds) =>
  Promise.allSettled(
    fileIds.map((fileId) => deleteCourseDataFile(courseId, fileId)),
  );

// ======================================================================
// 상세 보기 (본문 이미지 표시 · 첨부 파일 다운로드는 인증 헤더가 필요하므로 Blob 으로 처리)
// ======================================================================
function CourseDataDetail({ courseId, dataId, onClose, onEdit, onDelete, isDeleting }) {
  const contentRef = useRef(null);
  const [detail, setDetail] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getCourseDataDetail(courseId, dataId, { signal: controller.signal })
      .then((data) => setDetail(data))
      .catch((error) => {
        if (error.name !== "AbortError") setErrorMessage(error.message);
      });

    return () => controller.abort();
  }, [courseId, dataId]);

  // 본문 이미지(data-file-id) 를 Blob URL 로 표시
  useEffect(() => {
    const container = contentRef.current;
    if (!detail || !container) return;

    const controller = new AbortController();
    const objectUrls = [];

    container.querySelectorAll("img[data-file-id]").forEach((image) => {
      downloadCourseDataFile(courseId, image.dataset.fileId, {
        signal: controller.signal,
      })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          image.src = url;
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            image.alt = `${image.dataset.fileName ?? "이미지"} (불러오기 실패)`;
          }
        });
    });

    return () => {
      controller.abort();
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [courseId, detail]);

  // 첨부 파일 링크 클릭 → 권한 확인된 다운로드
  const handleContentClick = async (event) => {
    const link = event.target.closest("a[data-file-id]");
    if (!link) return;

    event.preventDefault();
    try {
      const blob = await downloadCourseDataFile(courseId, link.dataset.fileId);
      saveBlob(blob, link.dataset.fileName || link.dataset.fileId);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <h3 className={styles.formTitle}>{detail?.dataName ?? "교육 자료"}</h3>
        <div className={styles.rowActions}>
          {onEdit && detail && (
            <IconButton icon={icons.edit} onClick={onEdit}>
              수정
            </IconButton>
          )}
          {onDelete && detail && (
            <IconButton icon={icons.delete} disabled={isDeleting} onClick={onDelete}>
              {isDeleting ? "삭제 중..." : "삭제"}
            </IconButton>
          )}
          <IconButton icon={icons.close} onClick={onClose}>
            목록
          </IconButton>
        </div>
      </div>

      {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      {!detail && !errorMessage && (
        <p className={styles.loading}>교육 자료를 불러오는 중입니다.</p>
      )}

      {detail && (
        <>
          <p className={styles.detailMeta}>
            생성일 {formatDateTime(detail.crtDt)} · 수정일{" "}
            {formatDateTime(detail.mdfyDt)}
          </p>
          {/* 서버에서 Sanitize 된 HTML (허용 태그 · 속성 · class · style 만 포함) */}
          <div
            ref={contentRef}
            className={`lw-editor-content ${styles.detailContent}`}
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: detail.content }}
          />
        </>
      )}
    </div>
  );
}

// ======================================================================
// 교육 자료 관리
// ======================================================================
export default function MyCourseData({ courseId: courseIdProp }) {
  const params = useParams();

  // 부모(MyCourse)에서 받은 courseId 우선, 없으면 URL 파라미터(CourseItem :id) 사용
  const courseId = courseIdProp ?? params?.courseId ?? params?.id;

  // 교육 자료 권한 (CourseDataController 의 @RequireAction 과 같은 코드)
  const { can } = usePermission();
  const canCreate = can("COURSE_DATA_CREATE");
  const canUpdate = can("COURSE_DATA_UPDATE");
  const canDelete = can("COURSE_DATA_DELETE");

  // 목록
  const [courseDataList, setCourseDataList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(courseId));
  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  // 검색어(입력값) 와 실제 조회 조건(Debounce 적용 후). 검색어가 바뀌면 1페이지부터 조회
  const [searchKeyword, setSearchKeyword] = useState("");
  const [query, setQuery] = useState({ keyword: "", page: 1 });
  const [reloadKey, setReloadKey] = useState(0);
  const currentPage = query.page;

  // 등록 · 수정 (같은 화면 · 같은 에디터를 사용하고 모드만 구분)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingDataId, setEditingDataId] = useState(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editLoadError, setEditLoadError] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [originalFiles, setOriginalFiles] = useState([]);
  const [dataName, setDataName] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef(null); // 에디터 인스턴스 (getContentHtml · isEmpty)
  const savingRef = useRef(false);
  const editRequestRef = useRef(null);

  // 삭제
  const [isDeleting, setIsDeleting] = useState(false);
  const deletingRef = useRef(false);

  // 상세
  const [selectedDataId, setSelectedDataId] = useState(null);

  // 처리 결과 알림 (Toast)
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const isFormOpen = isRegisterOpen || isEditMode;

  const errorMessage = courseId
    ? loadErrorMessage
    : "과정 ID(courseId)를 확인할 수 없습니다.";

  const showToast = (message, type = "success") => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  };

  useEffect(
    () => () => {
      clearTimeout(toastTimerRef.current);
      editRequestRef.current?.abort();
    },
    [],
  );

  // 검색어 Debounce → 조회 조건 변경 (1페이지로 초기화)
  useEffect(() => {
    const timer = setTimeout(() => {
      const keyword = searchKeyword.trim();
      setQuery((previous) =>
        previous.keyword === keyword ? previous : { keyword, page: 1 },
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // 목록 조회. 조건이 바뀌면 이전 요청을 취소하여 늦게 도착한 응답이 최신 결과를 덮어쓰지 않게 한다
  useEffect(() => {
    if (!courseId) return;

    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const result = await getCourseDataList(
          courseId,
          { dataName: query.keyword, page: query.page, size: PAGE_SIZE },
          { signal: controller.signal },
        );
        if (controller.signal.aborted) return;

        setCourseDataList(result?.list ?? []);
        setTotalCount(result?.totalCount ?? 0);
        setTotalPages(result?.totalPages ?? 0);
        setLoadErrorMessage("");
      } catch (error) {
        if (error.name === "AbortError") return;

        setCourseDataList([]);
        setTotalCount(0);
        setTotalPages(0);
        setLoadErrorMessage(error.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [courseId, query, reloadKey]);

  // 등록 · 수정 화면에서 다른 탭으로 이동하는 등 컴포넌트가 사라지면 이번에 업로드한 임시 파일 정리
  const pendingFilesRef = useRef([]);
  useEffect(() => {
    pendingFilesRef.current = uploadedFiles.map((file) => file.fileId);
  }, [uploadedFiles]);
  useEffect(
    () => () => {
      if (pendingFilesRef.current.length > 0) {
        deleteTemporaryFiles(courseId, pendingFilesRef.current);
      }
    },
    [courseId],
  );

  const resetForm = () => {
    setDataName("");
    setEditorContent("");
    setInitialContent("");
    setOriginalFiles([]);
    setUploadedFiles([]);
    setErrors({});
    setIsUploading(false);
    setIsEditorReady(false);
    setEditLoadError("");
    // 에디터를 다시 마운트하여 본문 초기화
    setEditorKey((key) => key + 1);
  };

  const closeForm = () => {
    editRequestRef.current?.abort();
    resetForm();
    setIsRegisterOpen(false);
    setIsEditMode(false);
    setEditingDataId(null);
    setIsEditLoading(false);
  };

  const reloadList = () => setReloadKey((key) => key + 1);

  /** 이번 등록 · 수정에서 업로드한 파일만 정리 (수정 전 기존 파일은 제외) */
  const discardUploadedFiles = (fileIds) => {
    const targets = fileIds.filter((fileId) => !originalFiles.includes(fileId));
    pendingFilesRef.current = [];
    if (targets.length > 0) deleteTemporaryFiles(courseId, targets);
  };

  // 자료 추가
  const handleOpenRegister = () => {
    closeForm();
    setSelectedDataId(null);
    setIsRegisterOpen(true);
  };

  // 자료 수정: 상세 조회 후 기존 자료명 · 본문 · 첨부 파일을 에디터에 복원
  const handleOpenEdit = async (id) => {
    if (!id || savingRef.current) return;

    closeForm();
    setSelectedDataId(null);
    setIsEditMode(true);
    setEditingDataId(id);
    setIsEditLoading(true);

    const controller = new AbortController();
    editRequestRef.current = controller;
    try {
      const detail = await getCourseDataDetail(courseId, id, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      setDataName(detail?.dataName ?? "");
      setInitialContent(detail?.content ?? "");
      setEditorContent(detail?.content ?? "");
      setOriginalFiles(extractFileIds(detail?.content));
      setEditorKey((key) => key + 1);
    } catch (error) {
      if (error.name === "AbortError") return;
      setEditLoadError(error.message);
    } finally {
      if (!controller.signal.aborted) setIsEditLoading(false);
    }
  };

  const handleDataNameChange = (event) => {
    setDataName(event.target.value);
    if (errors.dataName) {
      setErrors((previous) => omitKey(previous, "dataName"));
    }
  };

  const handleEditorChange = (html) => {
    setEditorContent(html);
    if (errors.content) {
      setErrors((previous) => omitKey(previous, "content"));
    }
  };

  const handleFileUploaded = (fileInfo) => {
    setUploadedFiles((previous) => [...previous, fileInfo]);
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedName = dataName.trim();

    if (!trimmedName) {
      nextErrors.dataName = "자료 명을 입력해주세요.";
    } else if (trimmedName.length > DATA_NAME_MAX_LENGTH) {
      nextErrors.dataName = `자료 명은 ${DATA_NAME_MAX_LENGTH}자 이내로 입력해주세요.`;
    }

    if (!editorContent || editorRef.current?.isEmpty()) {
      nextErrors.content = "교육 자료 내용을 입력해주세요.";
    }

    if (isUploading) {
      nextErrors.global = "파일 업로드가 끝난 뒤 저장해주세요.";
    }

    if (isEditMode && (!editingDataId || !isEditorReady)) {
      nextErrors.global = "수정할 교육 자료를 확인할 수 없습니다. 목록에서 다시 선택해주세요.";
    }

    if (!courseId) {
      nextErrors.global = "과정 ID(courseId)를 확인할 수 없습니다.";
    }

    return nextErrors;
  };

  // 저장 (등록 · 수정 완료)
  const handleSave = async () => {
    // 중복 요청 방지 (state 반영 전 연속 클릭도 차단)
    if (savingRef.current) return;

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const content = editorRef.current.getContentHtml();
    const payload = { dataName: dataName.trim(), content };

    savingRef.current = true;
    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateCourseData(courseId, editingDataId, payload);
      } else {
        await insertCourseData(courseId, payload);
      }

      // 업로드했지만 본문에서 제거된 파일 정리 (본문에 남은 파일은 서버가 삭제를 거부)
      // 수정 전 기존 파일 중 본문에서 빠진 파일은 서버가 다른 자료의 참조를 확인한 뒤 정리
      discardUploadedFiles(
        uploadedFiles
          .map((file) => file.fileId)
          .filter((fileId) => !content.includes(fileId)),
      );

      showToast(isEditMode ? "교육 자료가 수정되었습니다." : "교육 자료가 등록되었습니다.");
      closeForm();
      // 기존 검색어 · 페이지 그대로 재조회
      reloadList();
    } catch (error) {
      // 실패 시 화면 · 자료명 · 에디터 내용 · 첨부 파일 상태 유지
      const serverErrors = {};
      Object.entries(error?.validations ?? {}).forEach(([field, messages]) => {
        const key =
          field === "dataName" || field === "content" ? field : "global";
        serverErrors[key] = messages?.[0];
      });
      if (error?.errorCode === "COURSE_DATA_EMPTY_CONTENT") {
        serverErrors.content = error.message;
      }
      if (Object.keys(serverErrors).length === 0) {
        serverErrors.global = error.message;
      }
      setErrors(serverErrors);
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  };

  // 취소 (등록 · 수정 API 호출 없음, 이번에 업로드한 임시 파일만 정리 후 기존 검색 조건으로 재조회)
  const handleCancel = () => {
    if (savingRef.current) return;

    discardUploadedFiles(uploadedFiles.map((file) => file.fileId));
    closeForm();
    reloadList();
  };

  // 삭제: 확인 후 API 호출, 현재 페이지의 마지막 자료였다면 이전 페이지로 이동
  const handleDelete = async (id) => {
    if (!id || deletingRef.current) return;
    if (!window.confirm(DELETE_CONFIRM_MESSAGE)) return;

    deletingRef.current = true;
    setIsDeleting(true);
    try {
      await deleteCourseData(courseId, id);
      showToast("교육 자료가 삭제되었습니다.");

      if (selectedDataId === id) setSelectedDataId(null);

      const wasLastOnPage = courseDataList.length <= 1 && currentPage > 1;
      if (wasLastOnPage) {
        setQuery((previous) => ({ ...previous, page: previous.page - 1 }));
      } else {
        reloadList();
      }
    } catch (error) {
      // 실패 시 기존 목록 유지
      showToast(error.message || "교육 자료 삭제에 실패했습니다.", "error");
    } finally {
      deletingRef.current = false;
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setQuery((previous) => ({ ...previous, page }));
  };

  const showActions = canUpdate || canDelete;
  const gridHeader = showActions
    ? [...BASE_GRID_HEADER]
    : BASE_GRID_HEADER;

  const gridContent = courseDataList.map((courseData, index) => {
    return [
      {
        id: `${courseData.id}_rowNumber`,
        value: totalCount - (currentPage - 1) * PAGE_SIZE - index,
      },
      {id: `${courseData.id}_dataName`, value: courseData.dataName},
      {id: `${courseData.id}_crtDt`, value: formatDateTime(courseData.crtDt)},
      {id: `${courseData.id}_mdfyDt`, value: formatDateTime(courseData.mdfyDt)},
    ];
  });

  const hasData = courseDataList.length > 0;

  const toastElement = toast && (
    <div
      className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}
      role={toast.type === "error" ? "alert" : "status"}
    >
      {toast.message}
    </div>
  );

  // ------------------------------------------------------------------
  // 신규 등록 · 수정 화면 (같은 에디터 컴포넌트)
  // ------------------------------------------------------------------
  if (isFormOpen) {
    const showEditor = !isEditMode || (!isEditLoading && !editLoadError);
    // 수정 화면의 파일 업로드 · 링크 미리보기 API 는 등록 권한(COURSE_DATA_CREATE)이 필요
    const canUseUploadApi = !isEditMode || canCreate;

    return (
      <div className={styles.page}>
        <section className={styles.content}>
          <h3 className={styles.formTitle}>
            {isEditMode ? "교육 자료 수정" : "새 교육 자료 등록"}
          </h3>

          <div className={styles.buttons}>
            <IconButton
              icon={icons.ok}
              disabled={isSaving || isUploading || !showEditor || (isEditMode && !isEditorReady)}
              onClick={handleSave}
            >
              {isSaving
                ? "저장 중..."
                : isUploading
                  ? "업로드 중..."
                  : isEditMode
                    ? "수정 완료"
                    : "저장"}
            </IconButton>
            <IconButton icon={icons.close} disabled={isSaving} onClick={handleCancel}>
              취소
            </IconButton>
          </div>

          {isEditMode && isEditLoading && (
            <p className={styles.loading}>교육 자료를 불러오는 중입니다.</p>
          )}
          {isEditMode && editLoadError && (
            <p className={styles.fieldError}>{editLoadError}</p>
          )}

          {showEditor && (
            <>
              <div className={styles.field}>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="자료 명을 입력하세요."
                  aria-label="자료 명"
                  maxLength={DATA_NAME_MAX_LENGTH}
                  value={dataName}
                  onChange={handleDataNameChange}
                  disabled={isSaving}
                />
                {errors.dataName && (
                  <p className={styles.fieldError}>{errors.dataName}</p>
                )}
              </div>

              <div className={styles.field}>
                <Editor
                  key={editorKey}
                  ref={editorRef}
                  ariaLabel="교육 자료 내용"
                  placeholder="교육 자료 내용을 입력하세요. 파일은 툴바 버튼, 드래그 앤 드롭, 붙여넣기로 첨부할 수 있습니다."
                  initialContent={initialContent}
                  onReady={() => setIsEditorReady(true)}
                  onLoadFile={(fileId) => downloadCourseDataFile(courseId, fileId)}
                  onLinkPreview={
                    canUseUploadApi ? (url) => getLinkPreview(courseId, url) : undefined
                  }
                  onUploadFile={
                    canUseUploadApi ? (file) => uploadCourseDataFile(courseId, file) : undefined
                  }
                  onUploadDiscard={(fileInfo) =>
                    deleteTemporaryFiles(courseId, [fileInfo.fileId])
                  }
                  disabled={isSaving}
                  onChange={handleEditorChange}
                  onUploadingChange={setIsUploading}
                  onFileUploaded={handleFileUploaded}
                />
                {errors.content && (
                  <p className={styles.fieldError}>{errors.content}</p>
                )}
              </div>
            </>
          )}

          {errors.global && (
            <p className={styles.fieldError}>{errors.global}</p>
          )}
        </section>
        {toastElement}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 상세 화면
  // ------------------------------------------------------------------
  if (selectedDataId) {
    return (
      <div className={styles.page}>
        <section className={styles.content}>
          <CourseDataDetail
            courseId={courseId}
            dataId={selectedDataId}
            onClose={() => setSelectedDataId(null)}
            onEdit={canUpdate ? () => handleOpenEdit(selectedDataId) : undefined}
            onDelete={canDelete ? () => handleDelete(selectedDataId) : undefined}
            isDeleting={isDeleting}
          />
        </section>
        {toastElement}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // 목록 화면
  // ------------------------------------------------------------------
  return (
    <div className={styles.page}>
      <section className={styles.content}>
        {canCreate && (
          <div className={styles.header}>
            <IconButton icon={icons.add} onClick={handleOpenRegister}>
              자료 추가
            </IconButton>
          </div>
        )}

        <input
          type="search"
          className={styles.textInput}
          placeholder="자료 명을 입력하세요."
          aria-label="자료 명 검색"
          value={searchKeyword}
          onChange={(event) => setSearchKeyword(event.target.value)}
        />

        <p className={styles.totalCount}>전체 {totalCount}건</p>

        {/* 조회 오류 */}
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {/* 조회 중 */}
        {isLoading && (
          <p className={styles.loading}>교육 자료를 불러오는 중입니다.</p>
        )}

        {/* 교육 자료 그리드 (자료명 클릭 시 상세, 관리 열에서 수정 · 삭제) */}
        {!isLoading && hasData && (
          <Grid
            title=""
            header={gridHeader}
            content={gridContent}
            columnStyle={"80px 1fr 200px 200px"}
            clickableColumn={{
              1: (_value, rowIndex) =>
                setSelectedDataId(courseDataList[rowIndex]?.id ?? null),
            }}
          />
        )}

        {/* 데이터 없음 */}
        {!isLoading && !hasData && !errorMessage && (
          <p className={styles.emptyMessage}>
            {query.keyword
              ? "검색 결과가 없습니다."
              : "등록된 교육 자료가 없습니다."}
          </p>
        )}

        {!isLoading && hasData && (
          <div className={styles.pagination}>
            {/* 공통 Paginator 는 0부터 시작하는 페이지 번호를 사용 */}
            <Paginator
              id="courseData"
              start={
                Math.floor((currentPage - 1) / PAGE_GROUP_SIZE) *
                PAGE_GROUP_SIZE
              }
              countPerPageGroup={PAGE_GROUP_SIZE}
              activePage={currentPage - 1}
              setActivePage={(pageIndex) => handlePageChange(pageIndex + 1)}
              totalPageCount={totalPages}
            />
          </div>
        )}
      </section>
      {toastElement}
    </div>
  );
}
