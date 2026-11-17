import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import Button from "../../common/ui/Button.jsx";
import Badge from "../../common/ui/Badge.jsx";
import QuestionBlock from "../../common/ui/QuestionBlock.jsx";
import Comment from "../../common/ui/Comment.jsx";
import { useToast } from "../../common/ui/feedbackContext.js";

/*
 * 표준 UI: 시험 문제 · 댓글 · 키-값 목록 · 타임라인 · 인용 · 상자 목록.
 * 스타일 원본은 src/styles/*.css의 전역 클래스, React 컴포넌트는 common/ui/. 가이드: frontend/docs/ui-style-guide.md 8장
 */

const Q1_OPTIONS = [
    { value: "1", label: "int" },
    { value: "2", label: "String" },
    { value: "3", label: "boolean" },
    { value: "4", label: "double" },
];

const LONG_COMMENT =
    "과제 제출 형식 관련 질문입니다. 압축 파일 안에 소스 코드와 실행 결과 캡처를 같이 넣으라고 하셨는데, 캡처는 이미지 파일 하나로 합쳐야 하나요, 아니면 여러 장이어도 괜찮을까요? 그리고 README 파일은 필수인지도 궁금합니다.";

/* ───── 예시 데이터 ───── */
const STUDENTS = Array.from({ length: 23 }, (_, i) => ({
    id: `stu${String(i + 1).padStart(2, "0")}`,
    name: ["홍길동", "김철수", "이영희", "박민수", "최지우", "정해인", "윤아름"][i % 7],
    course: ["풀스택 개발자", "데이터 분석"][i % 2],
    state: i % 9 === 3 ? "수료" : "수강 중",
}));

const QuestionGroup = () => {
    /* 문제 */
    const [q1, setQ1] = useState("2");
    const [q2, setQ2] = useState(["1", "3"]);
    const [code, setCode] = useState("");

    return (
        <>
            <GroupTitle>시험 문제 · 보기</GroupTitle>
            <Variants>
                <Variant
                    name="QuestionBlock: 객관식 (하나)"
                    source="styles/content.css · common/ui/QuestionBlock.jsx"
                    note={"Exam*Modal 문제 블록 · admin/test 보기 목록(선택 #bbfdbb)의 표준.\n보기 전체가 눌리는 칸이고 진짜 radio라 방향키로 이동"}
                    code={`<QuestionBlock no={1} title="..." score={5} options={options} value={answer} onChange={setAnswer} />`}
                >
                    <div style={{ width: "100%" }}>
                        <QuestionBlock no={1} title="Java의 기본형(primitive type)이 아닌 것은?" score={5} options={Q1_OPTIONS} value={q1} onChange={setQ1} />
                    </div>
                </Variant>
                <Variant name="채점 결과 (showResult)" note="정답 초록 · 고른 오답 빨강. 고칠 수 없음 (잠긴 정답 표시)" code={`<QuestionBlock ... value={submitted} answer={correct} showResult />`}>
                    <div style={{ width: "100%" }}>
                        <QuestionBlock no={1} title="Java의 기본형(primitive type)이 아닌 것은?" score={5} options={Q1_OPTIONS} value="3" answer="2" showResult />
                    </div>
                </Variant>
                <Variant name="여러 개 고르기 (multiple) + 문제 내용" note="body: 회색 상자 (줄바꿈 유지)" code={`<QuestionBlock multiple body="..." options={...} value={[...]} onChange={...} />`}>
                    <div style={{ width: "100%" }}>
                        <QuestionBlock
                            no={2}
                            title="HTTP 메서드 중 멱등(idempotent)인 것을 모두 고르세요."
                            score={10}
                            multiple
                            body={"같은 요청을 여러 번 보내도 서버 상태가 한 번 보낸 것과 같으면 멱등입니다."}
                            options={[
                                { value: "1", label: "GET" },
                                { value: "2", label: "POST" },
                                { value: "3", label: "PUT" },
                                { value: "4", label: "PATCH" },
                            ]}
                            value={q2}
                            onChange={setQ2}
                        />
                    </div>
                </Variant>
                <Variant name="코드 문제 + 답안 칸 (children)" note="code: 고정폭 상자. 주관식 · 코드 답안은 children으로 textarea" code={`<QuestionBlock code={src}>\n  <textarea className="form-control form-control-mono" aria-label="답안" />\n</QuestionBlock>`}>
                    <div style={{ width: "100%" }}>
                        <QuestionBlock no={3} title="다음 코드의 출력 결과를 쓰세요." score={10} code={'int a = 7;\nint b = 2;\nSystem.out.println(a / b + a % b);'}>
                            <textarea
                                className="form-control form-control-mono"
                                aria-label="3번 답안"
                                placeholder="답안 입력"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                style={{ minHeight: "64px" }}
                            />
                        </QuestionBlock>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const CommentGroup = () => {
    const toast = useToast();

    /* 댓글 */
    const [reply, setReply] = useState("");

    return (
        <>
            <GroupTitle>댓글</GroupTitle>
            <Variants wide>
                <Variant
                    name="Comment (답글 · 긴 글 접기) + 답글 입력"
                    source="styles/content.css · common/ui/Comment.jsx"
                    note={"HomeworkReply · ReplyForm의 표준. 120자를 넘는 글은 3줄로 접고 [더 보기].\n답글은 왼쪽 선으로 들여 씀. 작업 버튼은 btn-text"}
                    block
                    code={`
<ul className="comment-list">
  <Comment author="홍길동" time="2026-11-16 14:20" body={text}
           actions={<Button variant="text">답글</Button>}>
    <Comment author="김강사" badge={<Badge tone="primary">강사</Badge>} time="..." body="..." />
  </Comment>
</ul>`}
                >
                    <ul className="comment-list">
                        <Comment
                            author="홍길동"
                            time="2026-11-16 14:20"
                            body={LONG_COMMENT}
                            actions={
                                <>
                                    <Button variant="text">답글</Button>
                                    <Button variant="text">수정</Button>
                                    <Button variant="text">삭제</Button>
                                </>
                            }
                        >
                            <Comment author="김강사" badge={<Badge tone="primary">강사</Badge>} time="2026-11-16 15:02" body={"이미지는 여러 장이어도 괜찮습니다.\nREADME는 선택입니다."} />
                        </Comment>
                        <Comment author="이영희" time="2026-11-16 16:45" body="마감이 금요일 자정 맞나요?" actions={<Button variant="text">답글</Button>} />
                    </ul>
                    <div className="comment-form" style={{ marginTop: "12px" }}>
                        <textarea
                            className="form-control"
                            aria-label="댓글 입력"
                            placeholder="댓글을 입력하세요."
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                        />
                        <div className="btn-group btn-group-end">
                            <Button
                                variant="primary"
                                size="sm"
                                disabled={!reply.trim()}
                                onClick={() => {
                                    toast.success("댓글을 등록했습니다.");
                                    setReply("");
                                }}
                            >
                                등록
                            </Button>
                        </div>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

const DescListGroup = () => {
    return (
        <>
            <GroupTitle>키-값 목록 · 타임라인</GroupTitle>
            <Variants>
                <Variant
                    name="desc-list · desc-list-boxed"
                    source="styles/panel.css"
                    note="라벨 폭은 style={{ '--desc-label-width': '80px' }}로 조절"
                    block
                    code={`
<dl className="desc-list">
  <dt>아이디</dt><dd>user01</dd>
</dl>
<dl className="desc-list desc-list-boxed" style={{ "--desc-label-width": "80px" }}>...</dl>`}
                >
                    <div className="form-stack">
                        <dl className="desc-list">
                            <dt>과정</dt>
                            <dd>풀스택 28기</dd>
                            <dt>기간</dt>
                            <dd>2026-03-02 ~ 2026-12-18</dd>
                            <dt>담당 강사</dt>
                            <dd>김강사</dd>
                        </dl>
                        <dl className="desc-list desc-list-boxed" style={{ "--desc-label-width": "80px" }}>
                            <dt>아이디</dt>
                            <dd className="cell-mono">user01</dd>
                            <dt>이름</dt>
                            <dd>홍길동</dd>
                        </dl>
                    </div>
                </Variant>
                <Variant
                    name="timeline"
                    source="styles/panel.css (MyCounsel 상담 기록)"
                    block
                    code={`
<ol className="timeline">
  <li className="timeline-item">
    <div className="timeline-meta">2026-11-10 <span className="tag">학습</span></div>
    <p className="timeline-body">...</p>
  </li>
</ol>`}
                >
                    <ol className="timeline">
                        <li className="timeline-item">
                            <div className="timeline-meta">
                                2026-11-10 <span className="tag">학습</span>
                            </div>
                            <p className="timeline-body">진도 확인, 복습 자료 안내.</p>
                        </li>
                        <li className="timeline-item">
                            <div className="timeline-meta">
                                2026-10-28 <span className="tag">진로</span>
                            </div>
                            <p className="timeline-body">{"희망 직무: 백엔드\n포트폴리오 방향 상담"}</p>
                        </li>
                    </ol>
                </Variant>
            </Variants>
        </>
    );
};

const ContentBlockGroup = () => {

    return (
        <>
            <GroupTitle>인용 · 세로 키-값 · 상자 목록</GroupTitle>
            <Variants>
                <Variant name="quote: 의견 · 인용" source="styles/content.css" note="MyCounsel 의견 인용 상자의 표준" code={`<blockquote className="quote"><p>내용</p><footer>김강사</footer></blockquote>`}>
                    <blockquote className="quote" style={{ width: "100%" }}>
                        <p>{"기초 문법은 잘 이해하고 있습니다.\n예외 처리 부분을 한 번 더 복습하면 좋겠습니다."}</p>
                        <footer>김강사 · 2026-11-10 상담</footer>
                    </blockquote>
                </Variant>
                <Variant
                    name="desc-list-stacked: 라벨 위 · 값 아래"
                    source="styles/content.css"
                    note={"MyCounsel 3열 정보의 표준. 열 수는 --desc-columns (기본 3, 좁으면 2).\n항목마다 <div>로 dt + dd를 묶음"}
                    code={`<dl className="desc-list-stacked">\n  <div><dt>과정</dt><dd>풀스택 개발자</dd></div>\n</dl>`}
                >
                    <dl className="desc-list-stacked" style={{ width: "100%" }}>
                        <div>
                            <dt>과정</dt>
                            <dd>풀스택 개발자</dd>
                        </div>
                        <div>
                            <dt>상담 일시</dt>
                            <dd>2026-11-10 14:00</dd>
                        </div>
                        <div>
                            <dt>상담자</dt>
                            <dd>김강사</dd>
                        </div>
                        <div>
                            <dt>유형</dt>
                            <dd>
                                <span className="tag">학습</span>
                            </dd>
                        </div>
                        <div>
                            <dt>진단</dt>
                            <dd>
                                <Badge tone="info">중</Badge>
                            </dd>
                        </div>
                    </dl>
                </Variant>
                <Variant
                    name="list-boxed: 회색 상자 글머리 목록"
                    source="styles/content.css"
                    note="RoleUserMoveModal 대상 목록의 표준. 길면 --list-max-height로 높이 제한 + 스크롤"
                    code={`<ul className="list-boxed" style={{ "--list-max-height": "120px" }}>...</ul>`}
                >
                    <div style={{ width: "100%" }}>
                        <p className="field-hint" style={{ marginBottom: "6px" }}>
                            아래 5명을 &quot;강사&quot; 역할로 옮깁니다.
                        </p>
                        <ul className="list-boxed" style={{ "--list-max-height": "120px" }}>
                            {STUDENTS.slice(0, 5).map((s) => (
                                <li key={s.id}>
                                    {s.name} ({s.id})
                                </li>
                            ))}
                        </ul>
                    </div>
                </Variant>
            </Variants>
        </>
    );
};

export const StandardContentCatalog = () => (
    <div>
        <p className={styles.standardIntro}>시험 문제 · 댓글 · 키-값 목록 · 타임라인 · 인용 · 상자 목록. 스타일 원본: styles/content.css · panel.css(desc-list · timeline)</p>
        <QuestionGroup />
        <CommentGroup />
        <DescListGroup />
        <ContentBlockGroup />
    </div>
);
