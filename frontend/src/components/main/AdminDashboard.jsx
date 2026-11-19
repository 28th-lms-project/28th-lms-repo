import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Panel from "../common/ui/Panel";
import StatCard from "../common/ui/StatCard";
import Badge from "../common/ui/Badge";
import Progress from "../common/ui/Progress";
import StatusBox from "../common/ui/StatusBox";
import Table from "../common/ui/Table";
import usePermission from "../../hooks/usePermission";
import { getAdminDashboard, getSystemCheck } from "../../api/dashboard/dashboardApi";
import { COURSE_TAB, courseUrl } from "./dashboardShared";

/** 데이터 점검 종류 → 문구 · 배지 · 이동할 탭 */
const DATA_CHECK = {
  NO_TIMETABLE: { label: "시간표 미등록", tone: "warning", detail: () => "출석 · 진행률을 계산할 수 없습니다", tab: COURSE_TAB.timetable },
  NO_TUTOR: { label: "강사 없음", tone: "danger", detail: () => "강사가 배정되지 않았습니다", tab: 0 },
  INVALID_TUTOR: { label: "강사 ID 오류", tone: "danger", detail: (value) => `회원에 없는 강사 ID: ${value}`, tab: 0 },
  TIMETABLE_OUT_OF_PERIOD: { label: "기간 밖 시간표", tone: "neutral", detail: (value) => `과정 기간 밖 ${value}일`, tab: COURSE_TAB.timetable },
};

/** API 하나를 불러오는 작은 훅: { status: "loading" | "loaded" | "failed", data } */
function useLoad(load, enabled = true) {
  const [state, setState] = useState({ status: "loading", data: null });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    load({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: "loaded", data });
      })
      .catch((error) => {
        if (controller.signal.aborted || error?.name === "AbortError") return;
        setState({ status: "failed", data: null });
      });
    return () => controller.abort();
  }, [load, enabled]);
  return state;
}

/**
 * 관리자 대시보드 (frontend/docs/design/dashboard-design.md 7장, 축소판).
 * 수치 → 진행 중 과정별 현황 → 데이터 점검 · 회원 현황 → (슈퍼관리자) 시스템 점검.
 * 권한: DASHBOARD_ADMIN_READ. 과정 등록 여부와 상관없이 전체 현황을 본다.
 */
export default function AdminDashboard() {
  const { isSuperAdmin } = usePermission();
  const { status, data } = useLoad(getAdminDashboard);

  if (status === "loading") {
    return <StatusBox type="loading" />;
  }
  if (status === "failed") {
    return <StatusBox type="error" title="관리자 대시보드를 불러오지 못했습니다." />;
  }

  return (
    <div className="form-stack">
      <AdminSummaryCards data={data} />
      <ActiveCourses courses={data.courses ?? []} />
      <div className="layout-split">
        <DataChecks checks={data.dataChecks ?? []} />
        <Members roleMembers={data.roleMembers ?? []} locked={data.lockedMemberCount} />
      </div>
      {isSuperAdmin && <SystemCheck />}
    </div>
  );
}

function AdminSummaryCards({ data }) {
  return (
    <div className="card-grid">
      <StatCard
        label="진행 중 과정"
        value={data.activeCount}
        unit="개"
        hint={`시작 전 ${data.upcomingCount} · 종료 ${data.endedCount}`}
      />
      <StatCard
        label="수강생 · 강사"
        value={data.activeStudentCount}
        unit="명"
        hint={`진행 중 과정 기준 · 강사 ${data.activeTutorCount}명`}
      />
      <StatCard
        label="평균 출석률 (지금까지)"
        value={data.averageRateSoFar ?? "-"}
        unit={data.averageRateSoFar === null ? undefined : "%"}
        hint={data.averageRateSoFar === null ? "아직 진행된 수업일이 없습니다" : "진행 중 과정 수강생 전원 · 어제 기준"}
      />
      <StatCard
        label="출석 주의 학생"
        value={data.warningStudentCount}
        unit="명"
        hint="진행된 수업일의 80% 미만"
        trend={data.warningStudentCount > 0 ? "down" : undefined}
      />
      <StatCard label="채점 대기" value={data.pendingAnswerCount} unit="건" hint="진행 중 과정 전체" />
    </div>
  );
}

/** 진행 중 과정별 현황 표. 행을 누르면 그 과정 화면 */
function ActiveCourses({ courses }) {
  const navigate = useNavigate();
  const columns = [
    { key: "courseName", title: "과정", render: (course) => <strong>{course.courseName}</strong> },
    { key: "tutorNames", title: "강사", width: 120, render: (course) => course.tutorNames ?? "-" },
    { key: "period", title: "기간", width: 190, render: (course) => `${course.startDate} ~ ${course.endDated}` },
    { key: "studentCount", title: "수강생", width: 80, align: "num", render: (course) => `${course.studentCount}명` },
    {
      key: "progressRate",
      title: "진행률",
      width: 160,
      render: (course) =>
        course.totalClassDays > 0 ? (
          <Progress label={`${course.courseName} 진행률`} value={course.progressRate} size="sm" showValue />
        ) : (
          <Badge tone="warning">시간표 미등록</Badge>
        ),
    },
    {
      key: "averageRateSoFar",
      title: "출석률",
      width: 90,
      align: "num",
      render: (course) => (course.averageRateSoFar === null ? "-" : `${course.averageRateSoFar}%`),
    },
    {
      key: "warningCount",
      title: "주의",
      width: 70,
      align: "center",
      render: (course) =>
        course.warningCount > 0 ? <Badge tone="danger">{course.warningCount}명</Badge> : "-",
    },
    {
      key: "pendingAnswers",
      title: "채점 대기",
      width: 90,
      align: "center",
      render: (course) =>
        course.pendingAnswers > 0 ? <Badge tone="warning">{course.pendingAnswers}건</Badge> : "-",
    },
  ];

  return (
    <Panel title="진행 중 과정" subtitle={`${courses.length}개`} flush>
      <Table
        ariaLabel="진행 중 과정 현황"
        columns={columns}
        rows={courses}
        rowKey="id"
        size="sm"
        onRowClick={(course) => navigate(courseUrl(course.id))}
        emptyText="진행 중인 과정이 없습니다."
      />
    </Panel>
  );
}

/** 손볼 데이터. 누르면 그 과정 화면(시간표 문제면 시간표 탭) */
function DataChecks({ checks }) {
  const navigate = useNavigate();
  return (
    <Panel title="데이터 점검" subtitle={checks.length > 0 ? `${checks.length}건` : undefined} flush>
      {checks.length === 0 ? (
        <StatusBox type="empty" size="sm" title="손볼 데이터가 없습니다." />
      ) : (
        <ul className="list-group">
          {checks.map((check) => {
            const meta = DATA_CHECK[check.checkType] ?? { label: check.checkType, tone: "neutral", detail: () => "", tab: 0 };
            return (
              <li key={`${check.checkType}-${check.courseId}-${check.detail ?? ""}`}>
                <button
                  type="button"
                  className="list-item"
                  onClick={() => navigate(courseUrl(check.courseId, meta.tab))}
                >
                  <span>
                    {check.courseName}
                    <span className="card-meta"> · {meta.detail(check.detail)}</span>
                  </span>
                  <span className="list-item-end">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

/** 역할별 회원 수 · 잠긴 계정 */
function Members({ roleMembers, locked }) {
  const total = roleMembers.reduce((sum, role) => sum + role.memberCount, 0);
  return (
    <Panel
      title="회원"
      subtitle={`${total}명`}
      badge={locked > 0 ? <Badge tone="danger">로그인 잠김 {locked}명</Badge> : undefined}
      flush
    >
      <ul className="list-group">
        {roleMembers.map((role) => (
          <li key={role.roleId} className="list-item">
            <span>{role.roleDisplayName}</span>
            <span className="list-item-end">{role.memberCount}명</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** 슈퍼관리자 시스템 점검: 권한 코드 등록 상태 */
function SystemCheck() {
  const { status, data } = useLoad(getSystemCheck);

  let content;
  if (status === "loading") {
    content = <StatusBox type="loading" size="sm" />;
  } else if (status === "failed") {
    content = <StatusBox type="error" size="sm" title="시스템 점검을 불러오지 못했습니다." />;
  } else {
    const groups = [
      {
        key: "unregistered",
        title: "DB에 등록되지 않은 권한 코드",
        hint: "슈퍼관리자 말고는 아무도 쓸 수 없습니다. 접근 관리에서 등록하세요.",
        tone: "danger",
        items: (data.unregisteredCodes ?? []).map((code) => ({
          key: code.actionCode,
          label: code.actionCode,
          meta: `${code.description} · ${code.source}`,
        })),
      },
      {
        key: "ungranted",
        title: "아무 역할에도 허용되지 않은 권한 코드",
        hint: "등록은 됐지만 슈퍼관리자만 쓸 수 있습니다. 권한별 접근 권한 관리에서 허용하세요.",
        tone: "warning",
        items: (data.ungrantedCodes ?? []).map((code) => ({ key: code, label: code })),
      },
      {
        key: "unused",
        title: "코드에서 쓰지 않는 권한 코드",
        hint: "다른 브랜치에서 쓰는 코드일 수 있습니다. 정리 방법은 권한 가이드 6장.",
        tone: "neutral",
        items: (data.unusedCodes ?? []).map((code) => ({ key: code, label: code })),
      },
    ];
    content = (
      <div className="form-stack">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="card-meta">
              <Badge tone={group.items.length > 0 ? group.tone : "success"}>{group.items.length}</Badge>{" "}
              <strong>{group.title}</strong> · {group.hint}
            </p>
            {group.items.length > 0 && (
              <ul className="list-group">
                {group.items.map((item) => (
                  <li key={item.key} className="list-item">
                    <code>{item.label}</code>
                    {item.meta && <span className="list-item-end card-meta">{item.meta}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Panel title="시스템 점검" subtitle="슈퍼관리자">
      {content}
    </Panel>
  );
}
