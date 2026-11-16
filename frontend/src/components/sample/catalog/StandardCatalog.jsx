import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Field from "../../common/ui/Field.jsx";
import Badge from "../../common/ui/Badge.jsx";
import StatusBox from "../../common/ui/StatusBox.jsx";
import { icons } from "../../common/input/icons.js";

const MEMO_MAX = 200;

/**
 * 표준 UI (디자인 시스템). 스타일 원본은 src/styles/*.css의 전역 클래스,
 * React 컴포넌트는 common/ui/. 가이드: frontend/docs/ui-style-guide.md 8장
 */
export const StandardCatalog = () => {
    const [saving, setSaving] = useState(false);
    const [memo, setMemo] = useState("");
    const [userId, setUserId] = useState("홍길동");
    const [retryCount, setRetryCount] = useState(0);

    const userIdError = /[^a-z0-9]/i.test(userId) ? "아이디는 영문과 숫자만 쓸 수 있습니다." : "";

    const fakeSave = () => {
        setSaving(true);
        setTimeout(() => setSaving(false), 1500);
    };

    return (
        <div>
            <p className={styles.standardIntro}>
                앞으로 새 화면은 이 섹션의 클래스 · 컴포넌트를 씁니다. 아래 &quot;통일 전&quot; 섹션들은 비교용입니다.
                {"\n"}스타일 원본: src/styles/*.css (index.css가 불러옴) · React: src/components/common/ui/
            </p>

            <GroupTitle>버튼</GroupTitle>
            <Variants>
                <Variant
                    name="variant"
                    source="styles/button.css · common/ui/Button.jsx"
                    note="primary는 화면의 주 동작 하나만. danger-solid는 삭제를 확정하는 모달 버튼에만"
                    code={`
<Button>취소</Button>
<Button variant="primary">저장</Button>
<Button variant="danger">삭제</Button>
<Button variant="danger-solid">삭제 확정</Button>
<Button variant="text">자세히</Button>

// 컴포넌트 없이
<button type="button" className="btn btn-primary">저장</button>`}
                >
                    <Button>취소</Button>
                    <Button variant="primary">저장</Button>
                    <Button variant="danger">삭제</Button>
                    <Button variant="danger-solid">삭제 확정</Button>
                    <Button variant="text">자세히</Button>
                </Variant>
                <Variant
                    name="size · 아이콘"
                    source="common/ui/Button.jsx"
                    note="sm(30px)은 표 행 안처럼 좁은 곳. 아이콘만 있는 버튼은 aria-label 필수"
                    code={`
<Button icon={icons.add}>추가</Button>
<Button size="sm" icon={icons.edit}>수정</Button>
<Button icon={icons.refresh} aria-label="새로고침" />
<Button size="sm" variant="danger" icon={icons.delete} aria-label="삭제" />`}
                >
                    <Button icon={icons.add}>추가</Button>
                    <Button variant="primary" icon={icons.ok}>저장</Button>
                    <Button size="sm" icon={icons.edit}>수정</Button>
                    <Button size="sm" variant="primary">저장</Button>
                    <Button icon={icons.refresh} aria-label="새로고침" title="새로고침" />
                    <Button size="sm" variant="danger" icon={icons.delete} aria-label="삭제" title="삭제" />
                </Variant>
                <Variant
                    name="상태: 비활성 · 저장 중"
                    source="common/ui/Button.jsx"
                    note="loading이면 돌아가는 아이콘 + 비활성. 문구는 직접 바꿈"
                    code={`
<Button variant="primary" loading={saving} onClick={save}>
  {saving ? "저장 중..." : "저장"}
</Button>
<Button disabled>비활성</Button>`}
                >
                    <Button variant="primary" loading={saving} onClick={fakeSave}>
                        {saving ? "저장 중..." : "저장 (눌러 보기)"}
                    </Button>
                    <Button disabled>비활성</Button>
                    <Button variant="primary" disabled>비활성</Button>
                </Variant>
                <Variant
                    name="전체 폭 · 버튼 묶음"
                    source="styles/button.css"
                    note="btn-group: 간격 8px, btn-group-end: 오른쪽 정렬 (모달 바닥 · 폼 끝)"
                    block
                    code={`
<Button variant="primary" block>로그인</Button>

<div className="btn-group btn-group-end">
  <Button>취소</Button>
  <Button variant="primary">등록</Button>
</div>`}
                >
                    <Button variant="primary" block>로그인</Button>
                    <div className="btn-group btn-group-end" style={{ marginTop: "12px" }}>
                        <Button>취소</Button>
                        <Button variant="primary">등록</Button>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>입력 · 폼</GroupTitle>
            <Variants>
                <Variant
                    name="필드 (라벨 · 필수 · 힌트 · 오류)"
                    source="styles/form.css · common/ui/Field.jsx"
                    note="오류가 있으면 힌트 대신 오류만. 입력에 aria-invalid · aria-describedby를 붙임"
                    block
                    code={`
<Field label="아이디" htmlFor="userId" required
       hint="영문 · 숫자 4 ~ 20자" error={userIdError}>
  <input id="userId" className="form-control"
         value={userId} onChange={...}
         aria-invalid={!!userIdError}
         aria-describedby="userId-msg" />
</Field>`}
                >
                    <div className="form-stack">
                        <Field label="아이디" htmlFor="std-user-id" required hint="영문 · 숫자 4 ~ 20자" error={userIdError}>
                            <input
                                id="std-user-id"
                                className="form-control"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                aria-invalid={!!userIdError}
                                aria-describedby="std-user-id-msg"
                            />
                        </Field>
                        <Field label="이메일" htmlFor="std-email" hint="비밀번호 찾기에 씁니다.">
                            <input id="std-email" type="email" className="form-control" placeholder="name@example.com" aria-describedby="std-email-msg" />
                        </Field>
                    </div>
                </Variant>
                <Variant
                    name="셀렉트 · textarea (글자 수) · 비활성 · 읽기 전용"
                    source="styles/form.css"
                    block
                    code={`
<select className="form-control">...</select>

<Field label="상담 내용" htmlFor="memo"
       count={{ current: memo.length, max: 200 }}>
  <textarea id="memo" className="form-control" maxLength={200} />
</Field>

<input className="form-control" disabled />
<input className="form-control" readOnly />`}
                >
                    <div className="form-stack">
                        <Field label="과목" htmlFor="std-subject">
                            <select id="std-subject" className="form-control" defaultValue="">
                                <option value="" disabled>선택하세요</option>
                                <option>Java</option>
                                <option>Spring</option>
                            </select>
                        </Field>
                        <Field label="상담 내용" htmlFor="std-memo" count={{ current: memo.length, max: MEMO_MAX }}>
                            <textarea
                                id="std-memo"
                                className="form-control"
                                maxLength={MEMO_MAX}
                                value={memo}
                                placeholder="상담 내용을 입력하세요."
                                onChange={(e) => setMemo(e.target.value)}
                            />
                        </Field>
                        <div className="form-row">
                            <Field label="비활성" htmlFor="std-disabled">
                                <input id="std-disabled" className="form-control" value="수정 불가" disabled readOnly />
                            </Field>
                            <Field label="읽기 전용" htmlFor="std-readonly">
                                <input id="std-readonly" className="form-control" value="2026-11-16" readOnly />
                            </Field>
                        </div>
                    </div>
                </Variant>
                <Variant
                    name="접두어 입력 · 작은 크기 · 코드 입력"
                    source="styles/form.css"
                    note="form-control-sm(30px)은 표 안 · 툴바처럼 좁은 곳. form-control-mono는 코드 · ID"
                    block
                    code={`
<div className="input-group">
  <span className="input-group-text">ROLE_</span>
  <input className="form-control form-control-mono" />
</div>
<input className="form-control form-control-sm" />`}
                >
                    <div className="form-stack">
                        <Field label="역할 ID" htmlFor="std-role">
                            <div className="input-group">
                                <span className="input-group-text">ROLE_</span>
                                <input id="std-role" className="form-control form-control-mono" placeholder="STUDENT" />
                            </div>
                        </Field>
                        <div className="form-row">
                            <input className="form-control form-control-sm" placeholder="작은 입력" aria-label="작은 입력" />
                            <Button size="sm">확인</Button>
                        </div>
                    </div>
                </Variant>
                <Variant
                    name="체크박스 · 라디오"
                    source="styles/form.css"
                    note="네이티브 input + accent-color(강조색). 키보드 · 스크린 리더가 그대로 동작"
                    block
                    code={`
<div className="form-check-group">
  <label className="form-check">
    <input type="checkbox" /> 학생
  </label>
</div>`}
                >
                    <div className="form-stack">
                        <div className="form-check-group">
                            <label className="form-check"><input type="checkbox" defaultChecked /> 학생</label>
                            <label className="form-check"><input type="checkbox" /> 강사</label>
                            <label className="form-check"><input type="checkbox" disabled /> 비활성</label>
                        </div>
                        <div className="form-check-group" role="radiogroup" aria-label="문제 유형">
                            <label className="form-check"><input type="radio" name="std-qtype" defaultChecked /> 객관식</label>
                            <label className="form-check"><input type="radio" name="std-qtype" /> 주관식</label>
                            <label className="form-check"><input type="radio" name="std-qtype" /> O/X</label>
                        </div>
                    </div>
                </Variant>
            </Variants>
            <Variants wide>
                <Variant
                    name="한 줄 폼 (검색 툴바)"
                    source="styles/form.css"
                    note="form-row: 필드가 한 줄에 놓이고 좁으면 줄바꿈. 버튼은 입력 아래쪽에 맞춰 정렬"
                    block
                    code={`
<div className="form-row">
  <Field label="검색 조건" htmlFor="type"><select id="type" className="form-control">...</select></Field>
  <Field label="검색어" htmlFor="q"><input id="q" className="form-control" /></Field>
  <div className="btn-group">
    <Button variant="primary">검색</Button>
    <Button>초기화</Button>
  </div>
</div>`}
                >
                    <div className="form-row">
                        <Field label="검색 조건" htmlFor="std-search-type">
                            <select id="std-search-type" className="form-control">
                                <option>이름</option>
                                <option>아이디</option>
                            </select>
                        </Field>
                        <Field label="검색어" htmlFor="std-search-q">
                            <input id="std-search-q" type="search" className="form-control" placeholder="검색어를 입력하세요" />
                        </Field>
                        <div className="btn-group">
                            <Button variant="primary">검색</Button>
                            <Button>초기화</Button>
                        </div>
                    </div>
                </Variant>
            </Variants>

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
        </div>
    );
};
