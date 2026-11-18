/* 기록용: 샘플 "표준화 전 (기록)" 탭의 카탈로그. 표준화 전 모습을 남긴 것이라 새 예시를 더하지 않음 (표준 예시는 catalog/의 Standard*). */
import { useState } from "react";
import styles from "../Catalog.module.css";
import { GroupTitle, Variant, Variants } from "../CatalogParts.jsx";
import { Grid } from "../../../common/Grid.jsx";
import { IconButton } from "../../../common/input/IconButton.jsx";
import { icons } from "../../../common/input/icons.js";

const MEMBERS = [
    ["student01", "홍길동", "학생", "2026-03-02"],
    ["tutor01", "김강사", "강사", "2026-02-15"],
    ["admin", "관리자", "관리자", "2026-01-01"],
];

const ROLES = [
    { id: "ROLE_SUPER_ADMIN", name: "최고 관리자", users: 1, protectedRow: true },
    { id: "ROLE_ADMIN", name: "관리자", users: 2 },
    { id: "ROLE_TUTOR", name: "강사", users: 5 },
    { id: "ROLE_STUDENT", name: "학생", users: 120 },
];

const MENU_COLUMNS = [
    { title: "대메뉴", items: ["시스템 관리", "과정 관리", "내 강의실"] },
    { title: "중메뉴", items: ["회원 관리", "메뉴 관리", "코드 관리 (미사용)"] },
    { title: "소메뉴", items: [] },
];

export const ListCatalog = () => {
    const [activeRow, setActiveRow] = useState(0);
    const [selectedMenu, setSelectedMenu] = useState("시스템 관리");
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
                    name="CSS 모듈 표 (드래그 손잡이 · 보호 행 · 작업 칸 · 빈 행)"
                    source="admin/system/role/Role.jsx (.roleTable)"
                    note="드래그 중 행은 .dragging(opacity .4), 놓을 위치는 .dropAbove/.dropBelow(파란 inset 선)"
                    block
                >
                    <div className={styles.tableWrapper}>
                        <table className={styles.roleTable}>
                            <colgroup>
                                <col style={{ width: 44 }} />
                                <col style={{ width: 60 }} />
                                <col style={{ width: "30%" }} />
                                <col />
                                <col style={{ width: 200 }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th />
                                    <th>순위</th>
                                    <th>역할 ID</th>
                                    <th>이름 (회원 수)</th>
                                    <th className={styles.actions}>작업</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ROLES.map((role, i) => (
                                    <tr
                                        key={role.id}
                                        className={`${role.protectedRow ? styles.protectedRow : ""} ${i === 2 ? styles.dropAbove : ""} ${i === 3 ? styles.dragging : ""}`}
                                    >
                                        <td>
                                            {!role.protectedRow && (
                                                <span className={styles.handle} title="드래그해서 순서 변경">≡</span>
                                            )}
                                        </td>
                                        <td>{i + 1}</td>
                                        <td className={styles.mono}>{role.id}</td>
                                        <td>
                                            {role.name} ({role.users})
                                        </td>
                                        <td className={styles.actions}>
                                            {!role.protectedRow && (
                                                <>
                                                    <IconButton icon={icons.edit} iconSize={16}>수정</IconButton>
                                                    <IconButton icon={icons.delete} iconSize={16}>삭제</IconButton>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                <tr>
                                    <td colSpan={5} className={styles.tdEmpty}>
                                        (빈 행 예시) 등록된 역할이 없습니다.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Variant>
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

            <GroupTitle>선택 리스트</GroupTitle>
            <Variants wide>
                <Variant
                    name="3단 컬럼 리스트 (대 > 중 > 소)"
                    source="admin/system/menu/MenuColumn.jsx · Menu.jsx"
                    note="선택 행 #eef3fd + ◀, 미사용 흐리게, ⚠ 경고 아이콘(title 툴팁), 빈 목록"
                    block
                >
                    <div className={styles.columns}>
                        {MENU_COLUMNS.map((col) => (
                            <div key={col.title} className={styles.column}>
                                <div className={styles.columnHeader}>
                                    <span>{col.title}</span>
                                    <IconButton icon={icons.add} iconSize={16}>추가</IconButton>
                                </div>
                                <ul className={styles.list}>
                                    {col.items.length === 0 && (
                                        <li className={styles.listEmpty}>중메뉴를 선택하세요.</li>
                                    )}
                                    {col.items.map((item) => {
                                        const unused = item.includes("(미사용)");
                                        const selected = selectedMenu === item;
                                        return (
                                            <li
                                                key={item}
                                                className={`${styles.listItem} ${selected ? styles.listItemSelected : ""} ${unused ? styles.unused : ""}`}
                                                onClick={() => setSelectedMenu(item)}
                                            >
                                                <span className={styles.handle} title="드래그해서 순서 변경">≡</span>
                                                {item}
                                                {item === "메뉴 관리" && (
                                                    <span className={styles.warning} title="URL이 라우트에 없습니다">⚠</span>
                                                )}
                                                {selected && <span className={styles.selectedMark}>◀</span>}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        ))}
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
                <Variant name="회색 상자 글머리 목록" source="admin/system/role/RoleUserMoveModal.jsx (.userList)" block>
                    <ul className={styles.userList}>
                        <li>홍길동 (student01)</li>
                        <li>김철수 (student02)</li>
                        <li>이영희 (student03)</li>
                    </ul>
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
