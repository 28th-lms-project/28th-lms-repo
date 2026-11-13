import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import styles from "./MyCounsel.module.css";
import MyPassword from "../info/MyPassword.jsx";
import usePermission from "../../../hooks/usePermission";
import { Grid } from "../../common/Grid.jsx";
import { IconButton } from "../../common/input/IconButton";
import { icons } from "../../common/input/icons";

import {
  getAverageScore,
  getCapability,
  getConsultDataList,
  getCounselDetail,
  getCounselList,
  getOpinion,
  getScoreList,
  insertConsultData,
  insertCounsel,
  updateCapability,
  updateOpinion,
} from "../../../api/my/course/counselApi.js";

// 모든 과정의 교육시간은 동일하므로 DB 조회 없이 고정 표시
const EDUCATION_TIME = "09:00 ~ 18:00 (100일 800H)";

const DESC_MAX_LENGTH = 4000;
const CONTACT_MAX_LENGTH = 100;

// DB 값 1: 남자, 2: 여자
const GENDER_OPTIONS = [
  { value: 1, label: "남자" },
  { value: 2, label: "여자" },
];

// DB 값 0: 상, 1: 중, 2: 하
const LEVEL_OPTIONS = [
  { value: 0, label: "상", className: "levelHigh" },
  { value: 1, label: "중", className: "levelMid" },
  { value: 2, label: "하", className: "levelLow" },
];

const CAPABILITY_STAGES = [
  { key: "Start", label: "교육시작" },
  { key: "Mid", label: "교육중반" },
  { key: "End", label: "교육종료" },
];

const CONSULT_TYPES = ["학습", "진로", "취업", "기타"];

const LIST_GRID_HEADER = [
  { id: "studentName", title: "수강생" },
  { id: "opinion", title: "종합의견" },
];

const SCORE_GRID_HEADER = [
  { id: "setName", title: "과목" },
  { id: "score", title: "점수" },
];

const EMPTY_CAPABILITY = {
  capabilityStartLevel: null,
  capabilityStartDesc: "",
  capabilityMidLevel: null,
  capabilityMidDesc: "",
  capabilityEndLevel: null,
  capabilityEndDesc: "",
};

const findLabel = (options, value) =>
  options.find((option) => option.value === value)?.label;

// 입력값 검증 실패 시 첫 번째 메시지, 없으면 서버 오류 메시지
function getErrorMessage(error, fallback) {
  const firstValidation = Object.values(error?.validations ?? {})[0]?.[0];
  if (firstValidation) return firstValidation;

  return error instanceof Error ? error.message : fallback;
}

/**
 * 조회 함수를 실행하고 data · 로딩 · 오류 상태를 관리한다.
 * fetcher 가 바뀌면 다시 조회하고, reload 로 수동 재조회할 수 있다.
 */
function useFetch(fetcher, fallbackMessage) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const reload = useCallback(
    async (options) => {
      try {
        const result = await fetcher(options);
        setData(result);
        setErrorMessage("");
      } catch (error) {
        if (error.name === "AbortError") return;

        setErrorMessage(getErrorMessage(error, fallbackMessage));
      } finally {
        if (!options?.signal?.aborted) setIsLoading(false);
      }
    },
    [fetcher, fallbackMessage],
  );

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      await reload({ signal: controller.signal });
    })();

    return () => controller.abort();
  }, [reload]);

  return { data, isLoading, errorMessage, reload };
}

export default function MyCounsel({ courseId: courseIdProp }) {
  const params = useParams();
  const courseId = courseIdProp ?? params?.courseId ?? params?.id;

  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [counselList, setCounselList] = useState([]);
  const [isLoading, setIsLoading] = useState(Boolean(courseId));
  const [loadErrorMessage, setLoadErrorMessage] = useState("");

  // 선택한 수강생의 COURSE_STUDENT_ID. 값이 있으면 상세 화면 표시
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const errorMessage = courseId
    ? loadErrorMessage
    : "과정 ID(courseId)를 확인할 수 없습니다.";

  useEffect(() => {
    if (!courseId) return;

    const controller = new AbortController();

    (async () => {
      setIsLoading(true);
      try {
        const list = await getCounselList(courseId, {
          signal: controller.signal,
        });
        setCounselList(list ?? []);
        setLoadErrorMessage("");
      } catch (error) {
        if (error.name === "AbortError") return;

        setCounselList([]);
        setLoadErrorMessage(
          getErrorMessage(error, "상담 목록 조회 중 오류가 발생했습니다."),
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [courseId]);

  // 상세에서 종합의견을 저장하면 목록에도 바로 반영 (목록 재조회 없이 상태 유지)
  const handleOpinionSaved = useCallback((courseStudentId, opinion) => {
    setCounselList((previous) =>
      previous.map((counsel) =>
        counsel.courseStudentId === courseStudentId
          ? { ...counsel, opinion }
          : counsel,
      ),
    );
  }, []);

  if (!verifiedPassword) {
    return <MyPassword onVerified={setVerifiedPassword} />;
  }

  if (selectedStudentId) {
    return (
      <div className={styles.page}>
        <CounselDetail
          // 학생이 바뀌면 다시 마운트하여 이전 학생의 상태를 남기지 않는다
          key={selectedStudentId}
          courseId={courseId}
          courseStudentId={selectedStudentId}
          onBack={() => setSelectedStudentId(null)}
          onOpinionSaved={handleOpinionSaved}
        />
      </div>
    );
  }

  const selectStudent = (_value, rowIndex) =>
    setSelectedStudentId(counselList[rowIndex]?.courseStudentId ?? null);

  const gridContent = counselList.map((counsel) => [
    {
      id: `${counsel.courseStudentId}_studentName`,
      value: counsel.studentName,
    },
    {
      id: `${counsel.courseStudentId}_opinion`,
      value: counsel.opinion || "등록된 종합의견이 없습니다.",
    },
  ]);

  const hasCounsel = counselList.length > 0;

  return (
    <div className={styles.page}>
      <section className={styles.content}>
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {isLoading && (
          <p className={styles.message}>상담 목록을 불러오는 중입니다.</p>
        )}

        {!isLoading && hasCounsel && (
          <>
            <p className={styles.guide}>
              수강생을 선택하면 상담 상세 정보를 확인할 수 있습니다.
            </p>
            <Grid
              title=""
              header={LIST_GRID_HEADER}
              content={gridContent}
              columnStyle="160px 1fr"
              clickableColumn={{ 0: selectStudent, 1: selectStudent }}
            />
          </>
        )}

        {!isLoading && !hasCounsel && !errorMessage && (
          <p className={styles.message}>등록된 수강생이 없습니다.</p>
        )}
      </section>
    </div>
  );
}

function CounselDetail({ courseId, courseStudentId, onBack, onOpinionSaved }) {
  const { can } = usePermission();
  const canCreate = can("COUNSEL_CREATE");
  const canUpdate = can("COUNSEL_UPDATE");

  const fetchDetail = useCallback(
    (options) => getCounselDetail(courseId, courseStudentId, options),
    [courseId, courseStudentId],
  );
  const detail = useFetch(
    fetchDetail,
    "교육생 기본 정보 조회 중 오류가 발생했습니다.",
  );

  // 성별 · 연락처가 등록되어야 역량 진단 · 종합의견을 수정할 수 있다 (DB NOT NULL)
  const hasCounsel = detail.data?.gender != null;

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <button type="button" className={styles.backButton} onClick={onBack}>
          ← 수강생 목록
        </button>
      </div>

      <StudentInfoSection
        courseId={courseId}
        courseStudentId={courseStudentId}
        detail={detail}
        canCreate={canCreate}
      />

      {/* 기본 정보 조회 후 표시 (수정 가능 여부가 기본 정보에 따라 달라짐) */}
      {!detail.isLoading && (
        <>
          <CapabilitySection
            courseId={courseId}
            courseStudentId={courseStudentId}
            canUpdate={canUpdate && hasCounsel}
          />
          <ScoreSection courseId={courseId} courseStudentId={courseStudentId} />
          <ConsultSection
            courseId={courseId}
            courseStudentId={courseStudentId}
            canCreate={canCreate}
          />
          <OpinionSection
            courseId={courseId}
            courseStudentId={courseStudentId}
            canUpdate={canUpdate && hasCounsel}
            onSaved={onOpinionSaved}
          />
        </>
      )}
    </div>
  );
}

function Section({ title, actions, children }) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>{title}</h3>
        {actions && <div className={styles.buttons}>{actions}</div>}
      </div>
      {children}
    </section>
  );
}

function SaveCancelButtons({ isSaving, saveLabel = "저장", onSave, onCancel }) {
  return (
    <>
      <IconButton icon={icons.ok} disabled={isSaving} onClick={onSave}>
        {isSaving ? "저장 중..." : saveLabel}
      </IconButton>
      <IconButton icon={icons.close} disabled={isSaving} onClick={onCancel}>
        취소
      </IconButton>
    </>
  );
}

function StudentInfoSection({ courseId, courseStudentId, detail, canCreate }) {
  const { data: info, isLoading, errorMessage, reload } = detail;

  const [form, setForm] = useState({ gender: "", contact: "" });
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleRegister = async () => {
    if (isSaving) return;

    const contact = form.contact.trim();
    if (!form.gender) {
      setFormError("성별을 선택해주세요.");
      return;
    }
    if (!contact) {
      setFormError("연락처를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await insertCounsel(courseId, courseStudentId, {
        gender: Number(form.gender),
        contact,
      });
      setFormError("");
      await reload();
    } catch (error) {
      setFormError(
        getErrorMessage(error, "기본 정보 등록 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className={styles.message}>교육생 정보를 불러오는 중입니다.</p>;
  }

  if (!info) {
    return (
      <p className={styles.error}>
        {errorMessage || "교육생 정보를 찾을 수 없습니다."}
      </p>
    );
  }

  const hasCounsel = info.gender != null;

  return (
    <section className={styles.infoCard}>
      <h2 className={styles.infoTitle}>교육생 면담일지</h2>

      <dl className={styles.infoList}>
        <div>
          <dt>과정</dt>
          <dd>
            {info.courseNo}기 {info.courseName}
          </dd>
        </div>
        <div>
          <dt>교육기간</dt>
          <dd>
            {info.startDate} ~ {info.endDate}
          </dd>
        </div>
        <div>
          <dt>교육시간</dt>
          <dd>{EDUCATION_TIME}</dd>
        </div>
        <div>
          <dt>교육생</dt>
          <dd className={styles.studentName}>{info.studentName}</dd>
        </div>
        <div>
          <dt>성별</dt>
          <dd>{findLabel(GENDER_OPTIONS, info.gender) ?? "-"}</dd>
        </div>
        <div>
          <dt>연락처</dt>
          <dd>{info.contact || "-"}</dd>
        </div>
      </dl>

      {!hasCounsel && (
        <div className={styles.notice}>
          <p className={styles.noticeText}>
            상담 기본 정보가 없습니다. 성별과 연락처를 등록하면 역량 수준
            진단과 종합의견을 작성할 수 있습니다.
          </p>

          {canCreate && (
            <div className={styles.inlineForm}>
              <select
                className={styles.select}
                aria-label="성별"
                value={form.gender}
                disabled={isSaving}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    gender: event.target.value,
                  }))
                }
              >
                <option value="">성별 선택</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className={styles.input}
                aria-label="연락처"
                placeholder="연락처 (예: 010-1234-5678)"
                maxLength={CONTACT_MAX_LENGTH}
                value={form.contact}
                disabled={isSaving}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    contact: event.target.value,
                  }))
                }
              />
              <IconButton
                icon={icons.add}
                disabled={isSaving}
                onClick={handleRegister}
              >
                {isSaving ? "등록 중..." : "기본 정보 등록"}
              </IconButton>
            </div>
          )}

          {formError && <p className={styles.error}>{formError}</p>}
        </div>
      )}
    </section>
  );
}

function LevelBadge({ level }) {
  const option = LEVEL_OPTIONS.find((item) => item.value === level);

  if (!option) {
    return (
      <span className={`${styles.levelBadge} ${styles.levelNone}`}>미진단</span>
    );
  }

  return (
    <span className={`${styles.levelBadge} ${styles[option.className]}`}>
      {option.label}
    </span>
  );
}

function CapabilitySection({ courseId, courseStudentId, canUpdate }) {
  const fetchCapability = useCallback(
    (options) => getCapability(courseId, courseStudentId, options),
    [courseId, courseStudentId],
  );
  const { data, isLoading, errorMessage, reload } = useFetch(
    fetchCapability,
    "역량 수준 진단 조회 중 오류가 발생했습니다.",
  );

  const capability = data ?? EMPTY_CAPABILITY;

  // 수정 중인 값. null 이면 조회 모드
  const [form, setForm] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = form !== null;

  // 수정 시작 시 서버에서 받은 원본을 복사해서 편집
  const handleEdit = () => {
    setForm({
      ...capability,
      capabilityStartDesc: capability.capabilityStartDesc ?? "",
      capabilityMidDesc: capability.capabilityMidDesc ?? "",
      capabilityEndDesc: capability.capabilityEndDesc ?? "",
    });
    setSaveError("");
  };

  // 취소: 편집 값을 버리면 원본(capability)이 그대로 표시된다
  const handleCancel = () => {
    setForm(null);
    setSaveError("");
  };

  const handleChange = (name, value) =>
    setForm((previous) => ({ ...previous, [name]: value }));

  const handleSave = async () => {
    if (isSaving) return;

    const tooLong = CAPABILITY_STAGES.find(
      ({ key }) => form[`capability${key}Desc`].length > DESC_MAX_LENGTH,
    );
    if (tooLong) {
      setSaveError(
        `${tooLong.label} 진단 내용은 ${DESC_MAX_LENGTH}자 이내로 입력해주세요.`,
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateCapability(courseId, courseStudentId, form);
      await reload();
      setForm(null);
      setSaveError("");
    } catch (error) {
      // 실패 시 수정 모드와 입력값 유지
      setSaveError(
        getErrorMessage(error, "역량 수준 진단 저장 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const actions = isEditing ? (
    <SaveCancelButtons
      isSaving={isSaving}
      saveLabel="수정 완료"
      onSave={handleSave}
      onCancel={handleCancel}
    />
  ) : (
    canUpdate &&
    !isLoading && (
      <IconButton icon={icons.edit} onClick={handleEdit}>
        역량 수준 진단 수정
      </IconButton>
    )
  );

  return (
    <Section title="역량 수준 진단" actions={actions}>
      {isLoading && <p className={styles.message}>불러오는 중입니다.</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {!isLoading && (
        <div className={styles.stageGrid}>
          {CAPABILITY_STAGES.map(({ key, label }) => {
            const levelName = `capability${key}Level`;
            const descName = `capability${key}Desc`;

            return (
              <div
                key={key}
                className={`${styles.stageCard} ${isEditing ? styles.editing : ""}`}
              >
                <div className={styles.stageHeader}>
                  <span className={styles.stageLabel}>{label}</span>
                  {isEditing ? (
                    <select
                      className={styles.select}
                      aria-label={`${label} 진단 수준`}
                      value={form[levelName] ?? ""}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleChange(
                          levelName,
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                        )
                      }
                    >
                      <option value="">미진단</option>
                      {LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <LevelBadge level={capability[levelName]} />
                  )}
                </div>

                {isEditing ? (
                  <>
                    <textarea
                      className={styles.textarea}
                      aria-label={`${label} 진단 내용`}
                      placeholder="진단 내용을 입력하세요."
                      maxLength={DESC_MAX_LENGTH}
                      value={form[descName]}
                      disabled={isSaving}
                      onChange={(event) =>
                        handleChange(descName, event.target.value)
                      }
                    />
                    <span className={styles.counter}>
                      {form[descName].length} / {DESC_MAX_LENGTH}
                    </span>
                  </>
                ) : (
                  <p className={styles.stageDesc}>
                    {capability[descName] || "진단 내용이 없습니다."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {saveError && <p className={styles.error}>{saveError}</p>}
    </Section>
  );
}

function ScoreSection({ courseId, courseStudentId }) {
  const fetchScores = useCallback(
    (options) => getScoreList(courseId, courseStudentId, options),
    [courseId, courseStudentId],
  );
  const fetchAverage = useCallback(
    (options) => getAverageScore(courseId, courseStudentId, options),
    [courseId, courseStudentId],
  );

  const scores = useFetch(fetchScores, "성적 조회 중 오류가 발생했습니다.");
  const average = useFetch(
    fetchAverage,
    "평균 점수 조회 중 오류가 발생했습니다.",
  );

  const scoreList = scores.data ?? [];
  const hasScores = scoreList.length > 0;

  const gridContent = scoreList.map((score) => [
    { id: `${score.testSetId}_setName`, value: score.setName },
    { id: `${score.testSetId}_score`, value: score.score ?? "-" },
  ]);

  return (
    <Section title="성적">
      <div className={styles.scoreLayout}>
        <div className={styles.averageCard}>
          <span className={styles.averageLabel}>평균 점수</span>
          <strong className={styles.averageValue}>
            {average.isLoading ? "..." : (average.data ?? "-")}
          </strong>
          {!average.isLoading && average.data == null && (
            <span className={styles.averageHint}>성적 데이터 없음</span>
          )}
        </div>

        <div className={styles.scoreList}>
          {scores.isLoading && (
            <p className={styles.message}>불러오는 중입니다.</p>
          )}
          {scores.errorMessage && (
            <p className={styles.error}>{scores.errorMessage}</p>
          )}
          {average.errorMessage && (
            <p className={styles.error}>{average.errorMessage}</p>
          )}
          {!scores.isLoading && hasScores && (
            <Grid
              title=""
              header={SCORE_GRID_HEADER}
              content={gridContent}
              columnStyle="1fr 100px"
            />
          )}
          {!scores.isLoading && !hasScores && !scores.errorMessage && (
            <p className={styles.message}>등록된 성적이 없습니다.</p>
          )}
        </div>
      </div>
    </Section>
  );
}

const EMPTY_CONSULT_FORM = { consultType: CONSULT_TYPES[0], consultDesc: "" };

function ConsultSection({ courseId, courseStudentId, canCreate }) {
  const fetchConsults = useCallback(
    (options) => getConsultDataList(courseId, courseStudentId, options),
    [courseId, courseStudentId],
  );
  const { data, isLoading, errorMessage, reload } = useFetch(
    fetchConsults,
    "상담내용 조회 중 오류가 발생했습니다.",
  );

  const consultList = data ?? [];

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_CONSULT_FORM);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const closeForm = () => {
    setForm(EMPTY_CONSULT_FORM);
    setSaveError("");
    setIsRegisterOpen(false);
  };

  const handleSave = async () => {
    if (isSaving) return;

    const consultDesc = form.consultDesc.trim();
    if (!consultDesc) {
      setSaveError("상담내용을 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      await insertConsultData(courseId, courseStudentId, {
        consultType: form.consultType,
        consultDesc,
      });
      closeForm();
      await reload();
    } catch (error) {
      setSaveError(
        getErrorMessage(error, "상담내용 등록 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const actions = canCreate && !isRegisterOpen && (
    <IconButton icon={icons.add} onClick={() => setIsRegisterOpen(true)}>
      새 상담내용 등록
    </IconButton>
  );

  return (
    <Section title="상담내용" actions={actions}>
      {isRegisterOpen && (
        <div className={styles.registerForm}>
          <div className={styles.typeGroup} role="radiogroup" aria-label="상담 유형">
            {CONSULT_TYPES.map((type) => (
              <label
                key={type}
                className={`${styles.typeOption} ${
                  form.consultType === type ? styles.typeSelected : ""
                }`}
              >
                <input
                  type="radio"
                  name="consultType"
                  value={type}
                  checked={form.consultType === type}
                  disabled={isSaving}
                  onChange={() =>
                    setForm((previous) => ({ ...previous, consultType: type }))
                  }
                />
                {type}
              </label>
            ))}
          </div>
          <textarea
            className={styles.textarea}
            aria-label="상담내용"
            placeholder="상담내용을 입력하세요. 등록 후에는 수정하거나 삭제할 수 없습니다."
            maxLength={DESC_MAX_LENGTH}
            value={form.consultDesc}
            disabled={isSaving}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                consultDesc: event.target.value,
              }))
            }
          />
          <div className={styles.formFooter}>
            <span className={styles.counter}>
              {form.consultDesc.length} / {DESC_MAX_LENGTH}
            </span>
            <div className={styles.buttons}>
              <SaveCancelButtons
                isSaving={isSaving}
                onSave={handleSave}
                onCancel={closeForm}
              />
            </div>
          </div>
          {saveError && <p className={styles.error}>{saveError}</p>}
        </div>
      )}

      {isLoading && <p className={styles.message}>불러오는 중입니다.</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {!isLoading && consultList.length > 0 && (
        <ol className={styles.timeline}>
          {consultList.map((consult) => (
            <li key={consult.id} className={styles.timelineItem}>
              <div className={styles.timelineMeta}>
                <time className={styles.timelineDate}>
                  {consult.consultDate}
                </time>
                <span className={styles.typeTag}>{consult.consultType}</span>
              </div>
              <p className={styles.timelineDesc}>{consult.consultDesc}</p>
            </li>
          ))}
        </ol>
      )}

      {!isLoading && consultList.length === 0 && !errorMessage && (
        <p className={styles.message}>등록된 상담내용이 없습니다.</p>
      )}
    </Section>
  );
}

function OpinionSection({ courseId, courseStudentId, canUpdate, onSaved }) {
  const fetchOpinion = useCallback(
    (options) => getOpinion(courseId, courseStudentId, options),
    [courseId, courseStudentId],
  );
  const { data: opinion, isLoading, errorMessage, reload } = useFetch(
    fetchOpinion,
    "종합의견 조회 중 오류가 발생했습니다.",
  );

  // 수정 중인 값. null 이면 조회 모드
  const [draft, setDraft] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = draft !== null;

  const handleCancel = () => {
    setDraft(null);
    setSaveError("");
  };

  const handleSave = async () => {
    if (isSaving) return;

    const nextOpinion = draft.trim();

    setIsSaving(true);
    try {
      await updateOpinion(courseId, courseStudentId, { opinion: nextOpinion });
      await reload();
      onSaved(courseStudentId, nextOpinion);
      setDraft(null);
      setSaveError("");
    } catch (error) {
      setSaveError(
        getErrorMessage(error, "종합의견 저장 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const actions = isEditing ? (
    <SaveCancelButtons
      isSaving={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  ) : (
    canUpdate &&
    !isLoading && (
      <IconButton icon={icons.edit} onClick={() => setDraft(opinion ?? "")}>
        종합의견 수정
      </IconButton>
    )
  );

  return (
    <Section title="종합의견" actions={actions}>
      {isLoading && <p className={styles.message}>불러오는 중입니다.</p>}
      {errorMessage && <p className={styles.error}>{errorMessage}</p>}

      {!isLoading &&
        (isEditing ? (
          <textarea
            className={`${styles.textarea} ${styles.opinionTextarea}`}
            aria-label="종합의견"
            placeholder="종합의견을 입력하세요."
            value={draft}
            disabled={isSaving}
            onChange={(event) => setDraft(event.target.value)}
          />
        ) : (
          <div className={styles.opinionBox}>
            {opinion || (
              <span className={styles.message}>
                등록된 종합의견이 없습니다.
              </span>
            )}
          </div>
        ))}

      {saveError && <p className={styles.error}>{saveError}</p>}
    </Section>
  );
}
