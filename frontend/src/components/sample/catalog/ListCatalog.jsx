import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import { Grid } from "../../common/Grid.jsx";

const MEMBERS = [
    ["student01", "홍길동", "학생", "2026-03-02"],
    ["tutor01", "김강사", "강사", "2026-02-15"],
    ["admin", "관리자", "관리자", "2026-01-01"],
];

export const ListCatalog = () => {
    const [activeRow, setActiveRow] = useState(0);
    const [answer, setAnswer] = useState(1);
    const [openReply, setOpenReply] = useState(false);

    return (
        <div>
            <GroupTitle>Grid (common/Grid.jsx)</GroupTitle>
            <Variants wide>
                <Variant
                    name="선택 행 표시 (activeRows) + 클릭 컬럼"
                    source="admin/system/member/MemberManagement.jsx · Code.jsx · AccessRole.jsx"
                    note="첫 칸을 누르면 그 행이 선택됨. clickableColumn 콜백은 (value, rowIndex)"
                    block
                >
                    <Grid
                        columnStyle="1.5fr 1fr 1fr 1.5fr"
                        header={[
                            { id: "h-id", title: "아이디" },
                            { id: "h-name", title: "이름" },
                            { id: "h-role", title: "역할" },
                            { id: "h-date", title: "가입일" },
                        ]}
                        content={MEMBERS.map((row, r) =>
                            row.map((value, c) => ({ id: `m-${r}-${c}`, value })),
                        )}
                        activeRows={[activeRow]}
                        clickableColumn={{ 0: (_, rowIndex) => setActiveRow(rowIndex) }}
                    />
                </Variant>
            </Variants>

            <GroupTitle>native table</GroupTitle>
            <Variants wide>
                <Variant
                    name="줄무늬 · 점선 표 (텍스트 칸이 버튼 역할)"
                    source="admin/course/CourseTableComponent/ExamSetTable.jsx (인라인)"
                    block
                >
                    <table className={styles.zebraTable}>
                        <thead>
                            <tr>
                                <th>번호</th>
                                <th>시험명</th>
                                <th>공개 여부</th>
                                <th>문제</th>
                                <th>채점</th>
                                <th>삭제</th>
                            </tr>
                        </thead>
                        <tbody>
                            {["Java 기초", "Spring 중간", "React 기말"].map((name, i) => (
                                <tr key={name}>
                                    <td>{i + 1}</td>
                                    <td>{name}</td>
                                    <td className={styles.cellAction}>{i === 0 ? "공개" : "비공개"}</td>
                                    <td className={styles.cellAction}>문제 보기</td>
                                    <td className={styles.cellAction}>채점</td>
                                    <td className={styles.cellAction}>삭제</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Variant>
                <Variant
                    name="시간표 (오늘 행 · 과목 행 · 쉬는 시간)"
                    source="my/course/MyTimetable.jsx (.allTable · .todayRow · .subjectRow · .breakCell)"
                    block
                >
                    <div className={styles.tableScroll}>
                        <table className={styles.timetable}>
                            <thead>
                                <tr>
                                    <th>날짜</th>
                                    <th>1교시<br /><small>09:00</small></th>
                                    <th>2교시<br /><small>10:00</small></th>
                                    <th>쉬는 시간</th>
                                    <th>3교시<br /><small>11:00</small></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>11-15</td>
                                    <td>Java</td>
                                    <td>Java</td>
                                    <td className={styles.breakCell} />
                                    <td>SQL</td>
                                </tr>
                                <tr className={styles.todayRow}>
                                    <td>11-16 (오늘)</td>
                                    <td>Spring</td>
                                    <td>Spring</td>
                                    <td className={styles.breakCell} />
                                    <td>React</td>
                                </tr>
                                <tr className={styles.subjectRow}>
                                    <td>11-17</td>
                                    <td colSpan={2}>과목 평가</td>
                                    <td className={styles.breakCell} />
                                    <td>React</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>상세 · 키-값 목록</GroupTitle>
            <Variants>
                <Variant name="점선 구분 상세 목록 (110px | 1fr)" source="admin/system/member/MemberDetail.jsx (.detailList)" block>
                    <dl className={styles.detailList}>
                        <div><dt>아이디</dt><dd>student01</dd></div>
                        <div><dt>이름</dt><dd>홍길동</dd></div>
                        <div><dt>이메일</dt><dd><a className={styles.link} href="mailto:test@example.com">test@example.com</a></dd></div>
                        <div><dt>상태</dt><dd><span className={`${styles.badge} ${styles.badgeNormal}`}>정상</span></dd></div>
                    </dl>
                </Variant>
                <Variant name="회색 상자 상세 목록 (80px | 1fr)" source="my/info/MyInfoForm.jsx (.infoList)" block>
                    <dl className={styles.infoList}>
                        <dt>아이디</dt><dd>student01</dd>
                        <dt>이름</dt><dd>홍길동</dd>
                        <dt>역할</dt><dd>학생</dd>
                    </dl>
                </Variant>
                <Variant name="3열 정보 (라벨 위 · 값 아래)" source="my/course/MyCounsel.jsx (.infoList)" block>
                    <dl className={styles.infoGrid}>
                        <div><dt>이름</dt><dd>홍길동</dd></div>
                        <div><dt>과정</dt><dd>풀스택 28기</dd></div>
                        <div><dt>연락처</dt><dd>010-0000-0000</dd></div>
                    </dl>
                </Variant>
            </Variants>

            <GroupTitle>기타 목록</GroupTitle>
            <Variants>
                <Variant name="타임라인" source="my/course/MyCounsel.jsx (.timeline)" block>
                    <ol className={styles.timeline}>
                        <li className={styles.timelineItem}>
                            <span className={styles.timelineDate}>2026-11-10</span> <span className={styles.tag}>학습</span>
                            <p className={styles.timelineDesc}>진도 확인, 복습 자료 안내.</p>
                        </li>
                        <li className={styles.timelineItem}>
                            <span className={styles.timelineDate}>2026-10-28</span> <span className={styles.tag}>진로</span>
                            <p className={styles.timelineDesc}>{"희망 직무: 백엔드\n포트폴리오 방향 상담"}</p>
                        </li>
                    </ol>
                </Variant>
                <Variant name="보기 선택 목록" source="admin/test/test/Test.jsx (.answerList)" block>
                    <ul className={styles.answerList}>
                        {[1, 2, 3].map((n) => (
                            <li key={n} className={answer === n ? styles.answerActive : ""} onClick={() => setAnswer(n)}>
                                {n}. 보기 {n}
                            </li>
                        ))}
                    </ul>
                </Variant>
                <Variant name="시험 문제 블록" source="ExamQuestionViewModal.jsx · ExamTakeModal · ExamGradeModal (인라인)" block>
                    <div className={styles.question}>
                        <div className={styles.questionTitle}>
                            <span>1. 다음 코드의 출력은?</span>
                            <span className={styles.questionMeta}>주관식 · 10점</span>
                        </div>
                        <div className={styles.subQuestion}>System.out.println(1 + 2 + &quot;3&quot;);</div>
                        <div className={styles.answerBox}>33</div>
                    </div>
                </Variant>
                <Variant name="댓글 (누르면 펼침)" source="admin/course/CourseTableComponent/HomeworkReply.jsx/HomeworkReply.jsx (인라인)" block>
                    <div className={styles.reply} onClick={() => setOpenReply((v) => !v)}>
                        <div className={styles.replyName}>김강사</div>
                        <div className={styles.replyMeta}>2026-11-15 14:20 {openReply ? "▲" : "▼"}</div>
                        {openReply && (
                            <p className={styles.replyBody}>
                                참고 자료: <a href="https://example.com" onClick={(e) => e.preventDefault()}>https://example.com</a>
                            </p>
                        )}
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
