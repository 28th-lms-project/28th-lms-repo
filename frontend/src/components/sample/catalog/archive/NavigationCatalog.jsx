/* 기록용: 샘플 "표준화 전 (기록)" 탭의 카탈로그. 표준화 전 모습을 남긴 것이라 새 예시를 더하지 않음 (표준 예시는 catalog/의 Standard*). */
import { useState } from "react";
import styles from "../Catalog.module.css";
import { GroupTitle, Variant, Variants } from "../CatalogParts.jsx";
import Breadcrumb from "../../../archive/common/Breadcrumb.jsx";
import { Paginator } from "../../../common/Paginator.jsx";
import { IconButton } from "../../../common/input/IconButton.jsx";

const TABS = ["설문 목록", "설문 등록", "결과 보기"];
const COURSES = ["풀스택 28기", "백엔드 27기", "프론트엔드 12기"];

export const NavigationCatalog = () => {
    const [tab, setTab] = useState(0);
    const [segment, setSegment] = useState(0);
    const [folder, setFolder] = useState(0);
    const [plainTab, setPlainTab] = useState(0);
    const [course, setCourse] = useState(0);
    const [page, setPage] = useState(0);
    const [groupOpen, setGroupOpen] = useState(true);
    const [activeLink, setActiveLink] = useState("회원 관리");

    return (
        <div>
            <GroupTitle>브레드크럼 · 화면 제목</GroupTitle>
            <Variants>
                <Variant
                    name="Breadcrumb"
                    source="common/Breadcrumb.jsx"
                    note="항목은 useBreadcrumbs가 계산 (메뉴 화면은 DB 메뉴 이름). 여기서는 고정 값"
                >
                    <Breadcrumb
                        crumbs={[
                            { key: "a", title: "시스템 관리" },
                            { key: "b", title: "회원 관리" },
                            { key: "c", title: "회원 상세" },
                        ]}
                    />
                </Variant>
                <Variant name="PageContainer 머리 (브레드크럼 + 22px 제목)" source="common/PageContainer.jsx" note="이 페이지 맨 위에 실제 컴포넌트가 있음" block>
                    <div className={styles.pageHeader}>
                        <Breadcrumb crumbs={[{ key: "a", title: "내 강의실" }, { key: "b", title: "시간표" }]} />
                        <h2 className={styles.pageHeaderTitle}>시간표</h2>
                    </div>
                </Variant>
                <Variant name="밑줄 제목 (20px, 정의만 있고 미사용)" source="admin/system/access/Access.module.css (.pageTitle)" block>
                    <h2 className={styles.pageTitleUnderline}>접근 관리</h2>
                </Variant>
            </Variants>

            <GroupTitle>탭</GroupTitle>
            <Variants>
                <Variant name="회색 탭 바 + 둥근 위 모서리 상자" source="admin/survey/survey/Survey.jsx (.surveyHeader) · admin/test/test/Test.jsx" block>
                    <div className={styles.tabContainer}>
                        <ul className={styles.tabBar}>
                            {TABS.map((t, i) => (
                                <li key={t} className={tab === i ? styles.tabActive : ""} onClick={() => setTab(i)}>
                                    {t}
                                </li>
                            ))}
                        </ul>
                        <div className={styles.tabBody}>{TABS[tab]} 내용</div>
                    </div>
                </Variant>
                <Variant name="세그먼트 탭 (2단계)" source="admin/survey/survey/Survey.jsx (.surveyList)">
                    <ul className={styles.segmented}>
                        {["객관식", "주관식"].map((t, i) => (
                            <li key={t} className={segment === i ? styles.tabActive : ""} onClick={() => setSegment(i)}>
                                {t}
                            </li>
                        ))}
                    </ul>
                </Variant>
                <Variant name="폴더 탭 (모달 안)" source="admin/course/CourseTableComponent/ExamGradeModal.jsx (인라인)" block>
                    <div className={styles.folderTabs}>
                        {["홍길동", "김철수", "이영희"].map((t, i) => (
                            <button
                                key={t}
                                type="button"
                                className={`${styles.folderTab} ${folder === i ? styles.folderTabActive : ""}`}
                                onClick={() => setFolder(i)}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </Variant>
                <Variant
                    name="쿼리 파라미터 탭 (스타일 없음)"
                    source="my/course/MyCourse.jsx (ul.tab-list > button.active)"
                    note="tab-list · active 클래스가 어디에도 정의되어 있지 않아 기본 버튼으로 보임"
                >
                    <ul className={styles.unstyledTabs}>
                        {["시간표", "자료실", "상담", "면접"].map((t, i) => (
                            <li key={t}>
                                <button type="button" onClick={() => setPlainTab(i)} aria-pressed={plainTab === i}>
                                    {t}
                                </button>
                            </li>
                        ))}
                    </ul>
                </Variant>
                <Variant
                    name="세로 탭 (IconButton)"
                    source="admin/course/CourseMain.jsx"
                    note="선택: backgroundColor #fff, 나머지 buttonface, radius 0"
                >
                    <div className={styles.verticalTabs}>
                        {COURSES.map((c, i) => (
                            <IconButton
                                key={c}
                                backgroundColor={course === i ? "#fff" : "buttonface"}
                                style={{ borderRadius: 0, width: "100%", borderBottom: "1px solid #ddd" }}
                                onClick={() => setCourse(i)}
                            >
                                {c}
                            </IconButton>
                        ))}
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>사이드 메뉴 · 페이지 이동</GroupTitle>
            <Variants>
                <Variant
                    name="사이드 메뉴 (프로필 · 소제목 · 그룹 · 링크)"
                    source="menu/SideMenu.jsx · UserProfile.jsx"
                    note="현재 메뉴 #ff5252, 미사용 opacity .45, 그룹은 grid-rows 0fr→1fr로 펼침"
                >
                    <nav className={styles.sideMenu}>
                        <p className={styles.sideLogo}>Learning<br />Works</p>
                        <div className={styles.profile}>
                            <span className={styles.profileRole}>관리자</span>
                            <strong className={styles.profileName}>홍길동</strong>
                        </div>
                        <p className={styles.sideListTitle}>시스템 관리</p>
                        <div className={styles.sideGroup} onClick={() => setGroupOpen((v) => !v)}>
                            <span>회원 · 권한</span>
                            <span className={groupOpen ? styles.sideArrowOpen : ""}>›</span>
                        </div>
                        {groupOpen && (
                            <ul>
                                {["회원 관리", "역할 관리", "메뉴 관리"].map((m) => (
                                    <li key={m}>
                                        <a
                                            className={`${styles.sideLink} ${activeLink === m ? styles.sideLinkActive : ""}`}
                                            onClick={() => setActiveLink(m)}
                                        >
                                            {m}
                                        </a>
                                    </li>
                                ))}
                                <li>
                                    <a className={`${styles.sideLink} ${styles.sideUnused}`}>코드 관리 (미사용)</a>
                                </li>
                            </ul>
                        )}
                    </nav>
                </Variant>
                <Variant name="Paginator" source="common/Paginator.jsx · MemberManagement.jsx · MyCourseData.jsx" note="현재 페이지는 빨간 글자(.active). 10페이지 넘으면 처음 · 이전 · 다음 · 끝">
                    <div style={{ width: "100%" }}>
                        <Paginator
                            id="catalog-paginator"
                            start={Math.floor(page / 10) * 10}
                            countPerPageGroup={10}
                            activePage={page}
                            setActivePage={setPage}
                            totalPageCount={23}
                        />
                    </div>
                </Variant>
            </Variants>
        </div>
    );
};
