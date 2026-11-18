import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import styles from "./MyCounsel.module.css";
import MyPassword from "../info/MyPassword.jsx";
import usePermission from "../../../hooks/usePermission";
import Badge from "../../common/ui/Badge.jsx";
import Button from "../../common/ui/Button.jsx";
import Callout from "../../common/ui/Callout.jsx";
import ChoiceGroup from "../../common/ui/ChoiceGroup.jsx";
import Field from "../../common/ui/Field.jsx";
import Panel from "../../common/ui/Panel.jsx";
import StatCard from "../../common/ui/StatCard.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import Table from "../../common/ui/Table.jsx";
import { useConfirm, useToast } from "../../common/ui/feedbackContext.js";
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

// DB 값 0: 상, 1: 중, 2: 하 (배지 색: 상 success · 중 info · 하 warning · 미진단 neutral)
const LEVEL_OPTIONS = [
  { value: 0, label: "상", tone: "success" },
  { value: 1, label: "중", tone: "info" },
  { value: 2, label: "하", tone: "warning" },
];

// 수정할 때 고르는 수준 (ChoiceGroup 은 문자열 값, "" = 미진단)
const LEVEL_CHOICES = [
  ...LEVEL_OPTIONS.map((option) => ({
    value: String(option.value),
    label: option.label,
  })),
  { value: "", label: "미진단" },
];

const CAPABILITY_STAGES = [
  { key: "Start", label: "교육시작" },
  { key: "Mid", label: "교육중반" },
  { key: "End", label: "교육종료" },
];

const CONSULT_TYPES = ["학습", "진로", "취업", "기타"];
const CONSULT_TYPE_OPTIONS = CONSULT_TYPES.map((type) => ({
  value: type,
  label: type,
}));

const LIST_COLUMNS = [
  { key: "studentName", title: "수강생", width: "160px" },
  {
    key: "opinion",
    title: "종합의견",
    ellipsis: true,
    render: (row) =>
      row.opinion || (
        <span className="field-hint">등록된 종합의견이 없습니다.</span>
      ),
  },
];

const SCORE_COLUMNS = [
  { key: "setName", title: "과목" },
  {
    key: "score",
    title: "점수",
    width: "100px",
    align: "num",
    render: (row) => row.score ?? "-",
  },
];

const EMPTY_CAPABILITY = {
  capabilityStartLevel: null,
  capabilityStartDesc: "",
  capabilityMidLevel: null,
  capabilityMidDesc: "",
  capabilityEndLevel: null,
  capabilityEndDesc: "",
};

const LOCKED_REASON = "상담 기본 정보를 먼저 등록하세요.";

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
      <CounselDetail
        // 학생이 바뀌면 다시 마운트하여 이전 학생의 상태를 남기지 않는다
        key={selectedStudentId}
        courseId={courseId}
        courseStudentId={selectedStudentId}
        onBack={() => setSelectedStudentId(null)}
        onOpinionSaved={handleOpinionSaved}
      />
    );
  }

  if (errorMessage) {
    return <StatusBox type="error" detail={errorMessage} />;
  }

  if (isLoading) {
    return <StatusBox type="loading" title="상담 목록을 불러오는 중..." />;
  }

  return (
    <div className="form-stack">
      {counselList.length > 0 && (
        <p className="field-hint">
          수강생을 고르면 상담 상세 정보를 볼 수 있습니다.
        </p>
      )}
      <Table
        columns={LIST_COLUMNS}
        rows={counselList}
        rowKey="courseStudentId"
        onRowClick={(row) => setSelectedStudentId(row.courseStudentId ?? null)}
        ariaLabel="상담 수강생 목록"
        emptyText="등록된 수강생이 없습니다."
      />
    </div>
  );
}

function CounselDetail({ courseId, courseStudentId, onBack, onOpinionSaved }) {
  const { can } = usePermission();
  // 권한 코드는 @RequireAction(domain = "COURSE_COUNSEL", action = ...) → COURSE_COUNSEL_CREATE · COURSE_COUNSEL_UPDATE
  const canCreate = can("COURSE_COUNSEL_CREATE");
  const canUpdate = can("COURSE_COUNSEL_UPDATE");

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
    <div className="form-stack">
      <div>
        <Button variant="text" onClick={onBack}>
          ← 수강생 목록
        </Button>
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
            canUpdate={canUpdate}
            isLocked={!hasCounsel}
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
            canUpdate={canUpdate}
            isLocked={!hasCounsel}
            onSaved={onOpinionSaved}
          />
        </>
      )}
    </div>
  );
}

/** 보기 ↔ 수정: [수정] → [취소] [저장] (권한이 없으면 숨김, 기본 정보가 없으면 비활성 + 이유) */
function EditActions({ isEditing, isSaving, canEdit, isLocked, onEdit, onCancel, onSave }) {
  if (isEditing) {
    return (
      <>
        <Button size="sm" disabled={isSaving} onClick={onCancel}>
          취소
        </Button>
        <Button size="sm" variant="primary" loading={isSaving} onClick={onSave}>
          {isSaving ? "저장 중..." : "저장"}
        </Button>
      </>
    );
  }

  if (!canEdit) return null;

  return (
    <Button
      size="sm"
      icon={icons.edit}
      disabled={isLocked}
      title={isLocked ? LOCKED_REASON : undefined}
      onClick={onEdit}
    >
      수정
    </Button>
  );
}

function StudentInfoSection({ courseId, courseStudentId, detail, canCreate }) {
  const toast = useToast();
  const { data: info, isLoading, errorMessage, reload } = detail;

  const [form, setForm] = useState({ gender: "", contact: "" });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const contact = form.contact.trim();
    if (!form.gender) {
      setFormErrors({ gender: "성별을 고르세요." });
      return;
    }
    if (!contact) {
      setFormErrors({ contact: "연락처를 입력하세요." });
      return;
    }

    setIsSaving(true);
    try {
      await insertCounsel(courseId, courseStudentId, {
        gender: Number(form.gender),
        contact,
      });
      setFormErrors({});
      await reload();
      toast.success("상담 기본 정보를 등록했습니다.");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "기본 정보 등록 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const setField = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setFormErrors((previous) => (previous[name] ? {} : previous));
  };

  if (isLoading) {
    return <StatusBox type="loading" title="교육생 정보를 불러오는 중..." />;
  }

  if (!info) {
    return (
      <StatusBox
        type={errorMessage ? "error" : "notFound"}
        title={errorMessage ? undefined : "교육생 정보를 찾을 수 없습니다."}
        detail={errorMessage || undefined}
      />
    );
  }

  const hasCounsel = info.gender != null;

  return (
    <>
      {!hasCounsel && (
        <Callout tone="warning" title="상담 기본 정보가 없습니다">
          성별과 연락처를 등록하면 역량 수준 진단과 종합의견을 작성할 수
          있습니다.
        </Callout>
      )}

      <Panel
        title="교육생 면담일지"
        badge={
          hasCounsel ? undefined : <Badge tone="warning">기본 정보 없음</Badge>
        }
      >
        <div className="form-stack">
        <dl className="desc-list-stacked">
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
            <dd>
              <strong>{info.studentName}</strong>
            </dd>
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

        {/* 기본 정보 등록 (등록 권한이 있을 때만) */}
        {!hasCounsel && canCreate && (
          <form
            className="form-row"
            onSubmit={handleRegister}
            noValidate
          >
            <Field
              label="성별"
              htmlFor="counselGender"
              required
              error={formErrors.gender}
            >
              <select
                id="counselGender"
                className="form-control"
                value={form.gender}
                disabled={isSaving}
                onChange={(event) => setField("gender", event.target.value)}
              >
                <option value="">성별 선택</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="연락처"
              htmlFor="counselContact"
              required
              error={formErrors.contact}
            >
              <input
                id="counselContact"
                type="text"
                className="form-control"
                placeholder="예: 010-1234-5678"
                maxLength={CONTACT_MAX_LENGTH}
                value={form.contact}
                disabled={isSaving}
                onChange={(event) => setField("contact", event.target.value)}
              />
            </Field>
            <div>
              <Button type="submit" variant="primary" loading={isSaving}>
                {isSaving ? "등록 중..." : "기본 정보 등록"}
              </Button>
            </div>
          </form>
        )}
        </div>
      </Panel>
    </>
  );
}

function LevelBadge({ level }) {
  const option = LEVEL_OPTIONS.find((item) => item.value === level);

  if (!option) return <Badge>미진단</Badge>;

  return <Badge tone={option.tone}>{option.label}</Badge>;
}

// 수정 시작 시 서버에서 받은 원본을 편집용으로 복사 (빈 내용은 "")
const toCapabilityForm = (capability) => ({
  ...capability,
  capabilityStartDesc: capability.capabilityStartDesc ?? "",
  capabilityMidDesc: capability.capabilityMidDesc ?? "",
  capabilityEndDesc: capability.capabilityEndDesc ?? "",
});

function CapabilitySection({ courseId, courseStudentId, canUpdate, isLocked }) {
  const toast = useToast();
  const confirm = useConfirm();

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
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = form !== null;

  const handleEdit = () => {
    setForm(toCapabilityForm(capability));
  };

  // 취소: 고친 내용이 있으면 확인 후 버림 (원본 capability 가 그대로 표시된다)
  const handleCancel = async () => {
    const isDirty =
      JSON.stringify(form) !== JSON.stringify(toCapabilityForm(capability));
    if (
      isDirty &&
      !(await confirm({
        message: "고친 내용을 버릴까요?",
        confirmText: "버리기",
        danger: true,
      }))
    )
      return;

    setForm(null);
  };

  const handleChange = (name, value) =>
    setForm((previous) => ({ ...previous, [name]: value }));

  const handleSave = async () => {
    if (isSaving) return;

    const tooLong = CAPABILITY_STAGES.find(
      ({ key }) => form[`capability${key}Desc`].length > DESC_MAX_LENGTH,
    );
    if (tooLong) {
      toast.error(
        `${tooLong.label} 진단 내용은 ${DESC_MAX_LENGTH}자 이내로 입력하세요.`,
      );
      return;
    }

    setIsSaving(true);
    try {
      await updateCapability(courseId, courseStudentId, form);
      await reload();
      setForm(null);
      toast.success("역량 수준 진단을 저장했습니다.");
    } catch (error) {
      // 실패 시 수정 모드와 입력값 유지
      toast.error(
        getErrorMessage(error, "역량 수준 진단 저장 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel
      title="역량 수준 진단"
      actions={
        !isLoading && (
          <EditActions
            isEditing={isEditing}
            isSaving={isSaving}
            canEdit={canUpdate}
            isLocked={isLocked}
            onEdit={handleEdit}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        )
      }
    >
      {isLoading && <StatusBox type="loading" size="sm" />}
      {errorMessage && (
        <StatusBox type="error" size="sm" detail={errorMessage} />
      )}

      {!isLoading && (
        <div className="card-grid">
          {CAPABILITY_STAGES.map(({ key, label }) => {
            const levelName = `capability${key}Level`;
            const descName = `capability${key}Desc`;
            const descId = `capability${key}Desc`;

            return (
              <div key={key} className="card">
                <div className="card-header">
                  <h3 className="card-title">{label}</h3>
                  {!isEditing && <LevelBadge level={capability[levelName]} />}
                </div>

                {isEditing ? (
                  <div className="form-stack">
                    <ChoiceGroup
                      variant="segmented"
                      name={`capability${key}Level`}
                      legend={`${label} 진단 수준`}
                      options={LEVEL_CHOICES.map((option) => ({
                        ...option,
                        disabled: isSaving,
                      }))}
                      value={form[levelName] == null ? "" : String(form[levelName])}
                      onChange={(value) =>
                        handleChange(
                          levelName,
                          value === "" ? null : Number(value),
                        )
                      }
                    />
                    <Field
                      label="진단 내용"
                      htmlFor={descId}
                      count={{
                        current: form[descName].length,
                        max: DESC_MAX_LENGTH,
                      }}
                    >
                      <textarea
                        id={descId}
                        className="form-control"
                        rows={3}
                        placeholder="진단 내용을 입력하세요."
                        maxLength={DESC_MAX_LENGTH}
                        value={form[descName]}
                        disabled={isSaving}
                        onChange={(event) =>
                          handleChange(descName, event.target.value)
                        }
                      />
                    </Field>
                  </div>
                ) : (
                  <p
                    className={`card-body ${styles.preLine}${
                      capability[descName] ? "" : " field-hint"
                    }`}
                  >
                    {capability[descName] || "진단 내용이 없습니다."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
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
  const hasAverage = !average.isLoading && average.data != null;

  return (
    <Panel title="성적">
      <div className={`layout-split layout-split-start ${styles.scoreSplit}`}>
        <StatCard
          label="평균 점수"
          value={average.isLoading ? "..." : (average.data ?? "-")}
          unit={hasAverage ? "점" : undefined}
          hint={
            !average.isLoading && average.data == null
              ? "성적 데이터 없음"
              : undefined
          }
        />

        <div className="form-stack">
          {scores.errorMessage && (
            <StatusBox type="error" size="sm" detail={scores.errorMessage} />
          )}
          {average.errorMessage && (
            <StatusBox type="error" size="sm" detail={average.errorMessage} />
          )}
          {scores.isLoading ? (
            <StatusBox type="loading" size="sm" />
          ) : (
            !scores.errorMessage && (
              <Table
                columns={SCORE_COLUMNS}
                rows={scoreList}
                rowKey="testSetId"
                size="sm"
                ariaLabel="성적"
                emptyText="등록된 성적이 없습니다."
              />
            )
          )}
        </div>
      </div>
    </Panel>
  );
}

const EMPTY_CONSULT_FORM = { consultType: CONSULT_TYPES[0], consultDesc: "" };

function ConsultSection({ courseId, courseStudentId, canCreate }) {
  const toast = useToast();
  const confirm = useConfirm();

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
  const [descError, setDescError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const closeForm = () => {
    setForm(EMPTY_CONSULT_FORM);
    setDescError("");
    setIsRegisterOpen(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (isSaving) return;

    const consultDesc = form.consultDesc.trim();
    if (!consultDesc) {
      setDescError("상담내용을 입력하세요.");
      return;
    }

    // 상담내용은 등록 후 수정 · 삭제할 수 없으므로 한 번 더 확인
    if (
      !(await confirm({
        title: "상담내용 등록",
        message: "등록한 상담내용은 고치거나 지울 수 없습니다. 등록할까요?",
        confirmText: "등록",
      }))
    )
      return;

    setIsSaving(true);
    try {
      await insertConsultData(courseId, courseStudentId, {
        consultType: form.consultType,
        consultDesc,
      });
      closeForm();
      await reload();
      toast.success("상담내용을 등록했습니다.");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "상담내용 등록 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel
      title="상담내용"
      subtitle={isLoading || errorMessage ? undefined : `${consultList.length}건`}
      actions={
        canCreate &&
        !isRegisterOpen && (
          <Button
            size="sm"
            icon={icons.add}
            onClick={() => setIsRegisterOpen(true)}
          >
            상담내용 등록
          </Button>
        )
      }
    >
      <div className="form-stack">
        {isRegisterOpen && (
          <form className="form-stack" onSubmit={handleSave} noValidate>
            <Field group label="상담 유형">
              <ChoiceGroup
                name="consultType"
                options={CONSULT_TYPE_OPTIONS.map((option) => ({
                  ...option,
                  disabled: isSaving,
                }))}
                value={form.consultType}
                onChange={(consultType) =>
                  setForm((previous) => ({ ...previous, consultType }))
                }
              />
            </Field>
            <Field
              label="상담내용"
              htmlFor="consultDesc"
              required
              error={descError}
              hint="등록한 뒤에는 고치거나 지울 수 없습니다."
              count={{ current: form.consultDesc.length, max: DESC_MAX_LENGTH }}
            >
              <textarea
                id="consultDesc"
                className="form-control"
                rows={4}
                placeholder="상담내용을 입력하세요."
                maxLength={DESC_MAX_LENGTH}
                value={form.consultDesc}
                disabled={isSaving}
                onChange={(event) => {
                  setForm((previous) => ({
                    ...previous,
                    consultDesc: event.target.value,
                  }));
                  setDescError("");
                }}
              />
            </Field>
            <div className="btn-group btn-group-end">
              <Button disabled={isSaving} onClick={closeForm}>
                취소
              </Button>
              <Button type="submit" variant="primary" loading={isSaving}>
                {isSaving ? "등록 중..." : "등록"}
              </Button>
            </div>
          </form>
        )}

        {isLoading && <StatusBox type="loading" size="sm" />}
        {errorMessage && (
          <StatusBox type="error" size="sm" detail={errorMessage} />
        )}

        {!isLoading && consultList.length > 0 && (
          <ol className="timeline">
            {consultList.map((consult) => (
              <li key={consult.id} className="timeline-item">
                <div className="timeline-meta">
                  <time>{consult.consultDate}</time>{" "}
                  <span className="tag">{consult.consultType}</span>
                </div>
                <p className={`timeline-body ${styles.preLine}`}>
                  {consult.consultDesc}
                </p>
              </li>
            ))}
          </ol>
        )}

        {!isLoading && consultList.length === 0 && !errorMessage && (
          <StatusBox type="empty" size="sm" title="등록된 상담내용이 없습니다." />
        )}
      </div>
    </Panel>
  );
}

function OpinionSection({ courseId, courseStudentId, canUpdate, isLocked, onSaved }) {
  const toast = useToast();
  const confirm = useConfirm();

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
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = draft !== null;

  const handleCancel = async () => {
    if (
      draft !== (opinion ?? "") &&
      !(await confirm({
        message: "고친 내용을 버릴까요?",
        confirmText: "버리기",
        danger: true,
      }))
    )
      return;

    setDraft(null);
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
      toast.success("종합의견을 저장했습니다.");
    } catch (error) {
      toast.error(
        getErrorMessage(error, "종합의견 저장 중 오류가 발생했습니다."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Panel
      title="종합의견"
      actions={
        !isLoading && (
          <EditActions
            isEditing={isEditing}
            isSaving={isSaving}
            canEdit={canUpdate}
            isLocked={isLocked}
            onEdit={() => setDraft(opinion ?? "")}
            onCancel={handleCancel}
            onSave={handleSave}
          />
        )
      }
    >
      {isLoading && <StatusBox type="loading" size="sm" />}
      {errorMessage && (
        <StatusBox type="error" size="sm" detail={errorMessage} />
      )}

      {!isLoading &&
        (isEditing ? (
          <Field label="종합의견" htmlFor="counselOpinion">
            <textarea
              id="counselOpinion"
              className="form-control"
              rows={5}
              placeholder="종합의견을 입력하세요."
              value={draft}
              disabled={isSaving}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Field>
        ) : opinion ? (
          <blockquote className="quote">
            <p>{opinion}</p>
          </blockquote>
        ) : (
          <p className="field-hint">등록된 종합의견이 없습니다.</p>
        ))}
    </Panel>
  );
}
