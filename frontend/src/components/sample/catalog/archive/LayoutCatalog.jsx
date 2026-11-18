/* 기록용: 샘플 "표준화 전 (기록)" 탭의 카탈로그. 표준화 전 모습을 남긴 것이라 새 예시를 더하지 않음 (표준 예시는 catalog/의 Standard*). */
import styles from "../Catalog.module.css";
import { GroupTitle, Variant, Variants } from "../CatalogParts.jsx";
import { IconButton } from "../../../common/input/IconButton.jsx";
import { icons } from "../../../common/input/icons.js";

export const LayoutCatalog = () => (
    <div>
        <GroupTitle>패널 · 카드</GroupTitle>
        <Variants>
            <Variant name="머리 · 본문 · 바닥 패널" source="admin/system/member/MemberDetail.jsx (.panel)" block>
                <div className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <h3 className={styles.panelTitle}>홍길동</h3>
                        <span className={`${styles.badge} ${styles.badgeNormal}`}>정상</span>
                    </div>
                    <dl className={styles.detailList}>
                        <div><dt>아이디</dt><dd>student01</dd></div>
                        <div><dt>역할</dt><dd>학생</dd></div>
                    </dl>
                    <div className={styles.panelFooter}>
                        <button type="button" className={styles.btnSecondary}>수정</button>
                        <button type="button" className={styles.btnSecondary}>비밀번호 초기화</button>
                        <button type="button" className={styles.btnDanger}>잠금</button>
                    </div>
                </div>
            </Variant>
            <Variant name="제목 밑줄 패널 (padding 30px)" source="admin/system/access-role/AccessRole.jsx (.panel · .panelTitle)" block>
                <div className={styles.panelPlain}>
                    <h3 className={styles.panelPlainTitle}>역할</h3>
                    <div className={styles.emptyFlex}>역할 목록</div>
                </div>
            </Variant>
            <Variant name="제목 + 버튼 줄 카드" source="my/course/MyCounsel.jsx (.section · .sectionHeader, 로컬 Section)" block>
                <section className={styles.cardSection}>
                    <div className={styles.cardSectionHeader}>
                        <h3 className={styles.cardSectionTitle}>상담 기록</h3>
                        <IconButton icon={icons.add} iconSize={16}>등록</IconButton>
                    </div>
                    <p className={styles.smallMessage}>등록된 상담이 없습니다.</p>
                </section>
            </Variant>
            <Variant name="왼쪽 강조선 정보 카드" source="my/course/MyCounsel.jsx (.infoCard)" block>
                <div className={styles.infoCard}>
                    <h3 className={styles.infoCardTitle}>홍길동</h3>
                    <p className={styles.guide13}>풀스택 28기 · 수강 중</p>
                </div>
            </Variant>
            <Variant name="수치 카드" source="my/course/MyCounsel.jsx (.averageCard)">
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>평균 점수</span>
                    <strong className={styles.statValue}>87.5</strong>
                    <span className={styles.statHint}>시험 4개 기준</span>
                </div>
            </Variant>
            <Variant name="의견 인용 상자" source="my/course/MyCounsel.jsx (.opinionBox)" block>
                <div className={styles.quote}>{"수업 참여도가 높고 과제 제출이 성실함.\n프로젝트 역할 분담을 더 연습할 것."}</div>
            </Variant>
        </Variants>

        <Variants wide>
            <Variant name="3칸 카드 그리드 (편집 중 강조)" source="my/course/MyCounsel.jsx (.stageGrid · .stageCard · .editing)" block>
                <div className={styles.cardGrid}>
                    {[
                        ["입과 진단", "상"],
                        ["중간 진단", "중"],
                        ["수료 진단", null],
                    ].map(([label, level], i) => (
                        <div key={label} className={`${styles.stageCard} ${i === 1 ? styles.stageCardEditing : ""}`}>
                            <div className={styles.stageCardHeader}>
                                <span>{label}</span>
                                <span
                                    className={`${styles.levelBadge} ${
                                        level === "상" ? styles.levelHigh : level === "중" ? styles.levelMid : styles.levelNone
                                    }`}
                                >
                                    {level ?? "미진단"}
                                </span>
                            </div>
                            <p className={styles.smallMessage}>{i === 1 ? "편집 중 (.editing)" : "진단 메모"}</p>
                        </div>
                    ))}
                </div>
            </Variant>
            <Variant name="상세 머리 (제목 + 작업 버튼) · 메타 · 본문 · 첨부 칩" source="my/course/MyCourseData.jsx (.detailHeader · .detailMeta · .detailContent · a.editor-file)" block>
                <div className={styles.detailHeader}>
                    <h3>1주차 수업 자료</h3>
                    <span className={styles.rowActions}>
                        <IconButton icon={icons.edit} iconSize={16}>수정</IconButton>
                        <IconButton icon={icons.delete} iconSize={16}>삭제</IconButton>
                    </span>
                </div>
                <p className={styles.detailMeta}>김강사 · 2026-11-10 · 조회 12</p>
                <div className={styles.detailContent}>
                    <p style={{ margin: "0 0 8px" }}>수업 자료를 올립니다.</p>
                    <a className={styles.fileChip} href="#" onClick={(e) => e.preventDefault()}>📎 week1.pdf</a>
                </div>
            </Variant>
            <Variant name="my/course 화면 틀 (.page > .content)" source="MyCourseData · MyInterview · MyTimetable · MyCounsel" block>
                <div className={styles.coursePage}>
                    <div className={styles.courseContent}>탭 내용 영역 (min-height 220px, 테두리 #ccc)</div>
                </div>
            </Variant>
        </Variants>

        <GroupTitle>화면 배치</GroupTitle>
        <Variants wide>
            <Variant name="목록 | 상세 (1fr 380px)" source="admin/system/member/MemberManagement.jsx (.layout)" block>
                <div className={styles.masterDetail}>
                    <div className={styles.layoutBlock}>목록 (툴바 + Grid + Paginator)</div>
                    <div className={styles.layoutBlock}>상세 패널</div>
                </div>
            </Variant>
            <Variant name="3패널 (1fr 1.1fr 1.1fr)" source="admin/system/access-role/AccessRole.jsx · admin/system/code/Code.jsx · menu/Menu.jsx" block>
                <div className={styles.threePanel}>
                    <div className={styles.layoutBlock}>역할</div>
                    <div className={styles.layoutBlock}>허용 권한</div>
                    <div className={styles.layoutBlock}>전체 권한</div>
                </div>
            </Variant>
            <Variant name="대시보드 카드 (Section과 같은 제목 여백)" source="main/Main.module.css (.contentContainer · .contentTitle · .contentItem)" block>
                <div className={styles.dashboardCard}>
                    <h3 className={styles.dashboardCardTitle}>오늘의 일정</h3>
                    <div className={styles.dashboardItem}>.contentItem (정의만 있고 미사용)</div>
                </div>
            </Variant>
        </Variants>
    </div>
);
