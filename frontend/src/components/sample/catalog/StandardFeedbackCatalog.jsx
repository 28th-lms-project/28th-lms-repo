import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Field from "../../common/ui/Field.jsx";
import Badge from "../../common/ui/Badge.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import Modal from "../../common/ui/Modal.jsx";
import { useConfirm, useToast } from "../../common/ui/feedbackContext.js";
import { icons } from "../../common/input/icons.js";
import Callout from "../../common/ui/Callout.jsx";
import Progress from "../../common/ui/Progress.jsx";

/*
 * 표준 UI: 배지 · 태그 · 안내 상자 · 상태 상자 · 진행 막대 · 토스트 · 모달.
 * 스타일 원본은 src/styles/*.css의 전역 클래스, React 컴포넌트는 common/ui/. 가이드: frontend/docs/ui-style-guide.md 8장
 */

const QUESTIONS = Array.from({ length: 8 }, (_, i) => ({
    no: i + 1,
    title: `${i + 1}번 문제`,
    body: "다음 코드의 실행 결과로 알맞은 것을 고르시오.",
}));

const BadgeGroup = () => {
    return (
        <>
            <GroupTitle>배지 · 태그</GroupTitle>
            <Variants>
                <Variant
                    name="Badge tone"
                    source="styles/badge.css · common/ui/Badge.jsx"
                    code={`
<Badge tone="success">정상</Badge>
<Badge tone="danger">계정 잠김</Badge>
<span className="badge badge-warning">채점 중</span>`}
                >
                    <Badge>미진단</Badge>
                    <Badge tone="primary">진행 중</Badge>
                    <Badge tone="success">정상</Badge>
                    <Badge tone="danger">계정 잠김</Badge>
                    <Badge tone="warning">채점 중</Badge>
                    <Badge tone="info">부분 정답</Badge>
                </Variant>
                <Variant
                    name="같은 의미 = 같은 tone"
                    source="MemberDetail · MyCounsel · ExamGradeModal (옮길 때)"
                    note="등급 · 채점 결과도 따로 색을 만들지 않고 tone으로 맞춤"
                >
                    <Badge tone="success">상</Badge>
                    <Badge tone="warning">중</Badge>
                    <Badge tone="danger">하</Badge>
                    <Badge tone="success">정답</Badge>
                    <Badge tone="danger">오답</Badge>
                    <Badge tone="info">부분정답</Badge>
                </Variant>
                <Variant
                    name="태그 (분류 칩)"
                    source="styles/badge.css"
                    code={`<span className="tag">학습</span>`}
                >
                    <span className="tag">학습</span>
                    <span className="tag">진로</span>
                    <span className="tag">생활</span>
                </Variant>
            </Variants>
        </>
    );
};

const CalloutGroup = () => {
    const toast = useToast();
    const [orderChanged, setOrderChanged] = useState(true);

    return (
        <>
            <GroupTitle>안내 상자 (Callout)</GroupTitle>
            <Variants>
                <Variant
                    name="tone 4가지"
                    source="styles/panel.css · common/ui/Callout.jsx"
                    note="화면에 머무는 안내. 결과 알림은 토스트, 화면을 못 쓰는 상태는 StatusBox"
                    block
                    code={`
<Callout tone="warning" title="주의">
  이 역할을 빼면 지금 계정이 메뉴 관리에 들어올 수 없습니다.
</Callout>`}
                >
                    <div className="form-stack">
                        <Callout tone="info">초기 비밀번호는 아이디와 같습니다.</Callout>
                        <Callout tone="success">모든 과제를 제출했습니다.</Callout>
                        <Callout tone="warning" title="주의">
                            이 역할을 빼면 지금 계정이 메뉴 관리에 들어올 수 없습니다.
                        </Callout>
                        <Callout tone="danger">마감이 지났습니다. 제출하면 지각으로 기록됩니다.</Callout>
                    </div>
                </Variant>
                <Variant
                    name="버튼이 있는 안내 (변경 알림)"
                    source="common/ui/Callout.jsx (actions)"
                    note="Role.jsx의 '순서가 변경되었습니다' 바"
                    block
                    code={`
<Callout tone="info" actions={<>
  <Button size="sm">되돌리기</Button>
  <Button size="sm" variant="primary">저장</Button>
</>}>순서가 변경되었습니다.</Callout>`}
                >
                    {orderChanged ? (
                        <Callout
                            tone="info"
                            actions={
                                <>
                                    <Button size="sm" onClick={() => setOrderChanged(false)}>되돌리기</Button>
                                    <Button
                                        size="sm"
                                        variant="primary"
                                        onClick={() => {
                                            setOrderChanged(false);
                                            toast.success("순서를 저장했습니다.");
                                        }}
                                    >
                                        저장
                                    </Button>
                                </>
                            }
                        >
                            순서가 변경되었습니다.
                        </Callout>
                    ) : (
                        <Button size="sm" onClick={() => setOrderChanged(true)}>다시 보기</Button>
                    )}
                </Variant>
            </Variants>
        </>
    );
};

const StatusGroup = () => {
    const [retryCount, setRetryCount] = useState(0);

    return (
        <>
            <GroupTitle>상태 상자</GroupTitle>
            <Variants>
                <Variant
                    name="권한 없음 · 빈 목록"
                    source="styles/status.css · common/ui/StatusBox.jsx"
                    block
                    code={`
<StatusBox type="denied" />
<StatusBox type="empty" title="검색 결과가 없습니다."
           detail="검색어를 바꿔 보세요." />`}
                >
                    <div className="form-stack">
                        <StatusBox type="denied" />
                        <StatusBox type="empty" title="검색 결과가 없습니다." detail="검색어를 바꿔 보세요." />
                    </div>
                </Variant>
                <Variant
                    name="불러오는 중 · 오류 + 다시 시도"
                    source="common/ui/StatusBox.jsx"
                    note="error는 role=alert, loading은 role=status로 스크린 리더에 알림"
                    block
                    code={`
<StatusBox type="loading" />
<StatusBox type="error" detail={error.message}
           onRetry={reload} />`}
                >
                    <div className="form-stack">
                        <StatusBox type="loading" />
                        <StatusBox
                            type="error"
                            detail={`서버에 연결할 수 없습니다.\n다시 시도한 횟수: ${retryCount}`}
                            onRetry={() => setRetryCount((n) => n + 1)}
                        />
                    </div>
                </Variant>
                <Variant
                    name="작은 크기 (목록 · 표 안)"
                    source="common/ui/StatusBox.jsx"
                    note="테두리 없이. 3단 컬럼 리스트 · 표의 빈 행 등"
                    block
                    code={`<StatusBox type="empty" size="sm" title="중메뉴를 선택하세요." />`}
                >
                    <div className="form-stack">
                        <StatusBox type="empty" size="sm" title="중메뉴를 선택하세요." />
                        <StatusBox type="loading" size="sm" />
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const ProgressGroup = () => {
    return (
        <>
            <GroupTitle>진행 막대</GroupTitle>
            <Variants>
                <Variant
                    name="Progress"
                    source="styles/status.css · common/ui/Progress.jsx"
                    note={"진도율 · 제출률 · 지난 기간 (CourseItem의 진행 계산을 보여 줄 곳).\ntone: 기본 강조색 · success(완료) · warning · danger(마감 임박)"}
                    code={`<Progress label="진도율" value={42} showValue />
<Progress label="제출률" value={18} max={20} tone="success" showValue />`}
                >
                    <div className="form-stack" style={{ gap: "10px", width: "100%" }}>
                        <Progress label="진도율" value={42} showValue />
                        <Progress label="제출률" value={18} max={20} tone="success" showValue />
                        <Progress label="과제 기간" value={88} tone="warning" showValue />
                        <Progress label="마감 임박" value={97} tone="danger" showValue />
                        <Progress label="작게" value={60} size="sm" />
                    </div>
                </Variant>
                <Variant name="카드 안에서" note="과정 카드 · 수치 카드 아래">
                    <div className="card" style={{ width: "100%" }}>
                        <div className="card-header">
                            <strong className="card-title">풀스택 개발자 과정</strong>
                            <Badge tone="primary">진행 중</Badge>
                        </div>
                        <p className="card-meta">2026-03-02 ~ 2026-08-28 · 120일 중 52일</p>
                        <Progress label="과정 진행" value={52} max={120} showValue />
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const ToastGroup = () => {
    const toast = useToast();

    return (
        <>
            <GroupTitle>토스트 (alert() 대신)</GroupTitle>
            <Variants>
                <Variant
                    name="useToast"
                    source="styles/toast.css · common/ui/feedbackContext.js"
                    note="화면 아래 가운데. 성공 · 기본 2.5초, 오류 4초. 누르면 닫힘. 한 번에 3개까지"
                    code={`
const toast = useToast();

toast.success("저장했습니다.");
toast.error(getErrorMessage(error));
toast.show("복사했습니다.");`}
                >
                    <Button icon={icons.ok} onClick={() => toast.success("저장했습니다.")}>성공</Button>
                    <Button icon={icons.error} onClick={() => toast.error("저장하지 못했습니다.\n잠시 후 다시 시도하세요.")}>오류</Button>
                    <Button onClick={() => toast.show("주소를 복사했습니다.")}>기본</Button>
                </Variant>
            </Variants>
        </>
    );
};

const ModalGroup = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const [formOpen, setFormOpen] = useState(false);
    const [formSaving, setFormSaving] = useState(false);
    const [newName, setNewName] = useState("");
    const [examOpen, setExamOpen] = useState(false);

    const submitForm = () => {
        setFormSaving(true);
        setTimeout(() => {
            setFormSaving(false);
            setFormOpen(false);
            toast.success(`${newName || "회원"}을(를) 등록했습니다.`);
            setNewName("");
        }, 1200);
    };

    const askDelete = async () => {
        const ok = await confirm({
            title: "시험 삭제",
            message: "Java 기초 시험을 삭제할까요?\n삭제하면 되돌릴 수 없습니다.",
            confirmText: "삭제",
            danger: true,
        });
        if (ok) toast.success("삭제했습니다.");
        else toast.show("취소했습니다.");
    };

    const askSave = async () => {
        if (await confirm("변경 내용을 저장할까요?")) toast.success("저장했습니다.");
    };

    const askSubmitExam = async () => {
        // 모달 안에서 확인 창: Esc는 맨 위 확인 창만 닫음
        if (await confirm({ title: "답안 제출", message: "제출하면 수정할 수 없습니다. 제출할까요?", confirmText: "제출" })) {
            setExamOpen(false);
            toast.success("답안을 제출했습니다.");
        }
    };

    return (
        <>
            <GroupTitle>모달 · 확인 창</GroupTitle>
            <Variants>
                <Variant
                    name="확인 창 (confirm() 대신)"
                    source="common/ui/feedbackContext.js · ConfirmDialog.jsx"
                    note="결과를 await로 받음. 바깥 클릭 · Esc = 취소. danger는 빨간 확인 버튼 + 취소 버튼에 포커스"
                    code={`
const confirm = useConfirm();

if (await confirm("저장할까요?")) save();

const ok = await confirm({
  title: "시험 삭제",
  message: "삭제할까요?\\n되돌릴 수 없습니다.",
  confirmText: "삭제",
  danger: true,
});`}
                >
                    <Button onClick={askSave}>저장 확인</Button>
                    <Button variant="danger" icon={icons.delete} onClick={askDelete}>삭제 확인</Button>
                </Variant>
                <Variant
                    name="폼 모달 (md 460px)"
                    source="common/ui/Modal.jsx"
                    note="onSubmit을 주면 모달이 <form>이 되어 Enter · 제출 버튼으로 저장. 저장 중에는 dismissible={false}로 닫기를 막음. 바깥 클릭으로는 닫히지 않음"
                    code={`
<Modal
  open={open}
  onClose={() => setOpen(false)}
  title="회원 등록"
  description="초기 비밀번호는 아이디와 같습니다."
  onSubmit={save}
  dismissible={!saving}
  footer={
    <>
      <Button onClick={() => setOpen(false)} disabled={saving}>취소</Button>
      <Button type="submit" variant="primary" loading={saving}>
        {saving ? "등록 중..." : "등록"}
      </Button>
    </>
  }
>
  <div className="form-stack">
    <Field label="이름" htmlFor="name" required>
      <input id="name" className="form-control" />
    </Field>
  </div>
</Modal>`}
                >
                    <Button variant="primary" icon={icons.add} onClick={() => setFormOpen(true)}>회원 등록</Button>
                </Variant>
                <Variant
                    name="내용 모달 (lg 800px) + 모달 안 확인 창"
                    source="common/ui/Modal.jsx"
                    note="summary로 제목 오른쪽 요약, 본문만 스크롤. closeOnBackdrop으로 바깥 클릭 닫기 허용 (읽기용)"
                    code={`
<Modal open={open} onClose={close} size="lg"
       title="Java 기초 시험" summary="문제 8개 · 총 80점"
       closeOnBackdrop
       footer={<Button variant="primary" onClick={submit}>제출</Button>}>
  ...
</Modal>`}
                >
                    <Button icon={icons.full} onClick={() => setExamOpen(true)}>시험 보기</Button>
                </Variant>
            </Variants>

            <Modal
                open={formOpen}
                onClose={() => setFormOpen(false)}
                title="회원 등록"
                description="초기 비밀번호는 아이디와 같습니다."
                onSubmit={submitForm}
                dismissible={!formSaving}
                footer={
                    <>
                        <Button onClick={() => setFormOpen(false)} disabled={formSaving}>취소</Button>
                        <Button type="submit" variant="primary" loading={formSaving}>
                            {formSaving ? "등록 중..." : "등록"}
                        </Button>
                    </>
                }
            >
                <div className="form-stack">
                    <Field label="이름" htmlFor="std-modal-name" required>
                        <input
                            id="std-modal-name"
                            className="form-control"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            required
                        />
                    </Field>
                    <Field label="역할" htmlFor="std-modal-role">
                        <select id="std-modal-role" className="form-control">
                            <option>학생</option>
                            <option>강사</option>
                        </select>
                    </Field>
                </div>
            </Modal>

            <Modal
                open={examOpen}
                onClose={() => setExamOpen(false)}
                size="lg"
                title="Java 기초 시험"
                summary={`문제 ${QUESTIONS.length}개 · 총 ${QUESTIONS.length * 10}점`}
                closeOnBackdrop
                footer={
                    <>
                        <Button onClick={() => setExamOpen(false)}>닫기</Button>
                        <Button variant="primary" onClick={askSubmitExam}>제출</Button>
                    </>
                }
            >
                <div className="form-stack">
                    {QUESTIONS.map((q) => (
                        <div key={q.no} className="card">
                            <div className="card-header">
                                <h3 className="card-title">{q.title}</h3>
                                <Badge>객관식 · 10점</Badge>
                            </div>
                            <p className="card-body">{q.body}</p>
                            <div className="form-check-group">
                                {[1, 2, 3, 4].map((n) => (
                                    <label key={n} className="form-check">
                                        <input type="radio" name={`std-exam-${q.no}`} /> 보기 {n}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
};

export const StandardFeedbackCatalog = () => (
    <div>
        <p className={styles.standardIntro}>배지 · 태그 · 안내 상자 · 상태 상자 · 진행 막대 · 토스트 · 모달. 스타일 원본: styles/badge.css · panel.css(callout) · status.css · toast.css · modal.css</p>
        <BadgeGroup />
        <CalloutGroup />
        <StatusGroup />
        <ProgressGroup />
        <ToastGroup />
        <ModalGroup />
    </div>
);
