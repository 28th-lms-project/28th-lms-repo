import { useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import { Button } from "../../common/input/Input.jsx";
import { IconButton } from "../../common/input/IconButton.jsx";
import { icons } from "../../common/input/icons.js";

const GRADES = [
    { key: "Y", label: "정답", color: "#1a7f37" },
    { key: "N", label: "오답", color: "#d1242f" },
    { key: "H", label: "부분정답", color: "#0969da" },
];

export const ButtonCatalog = () => {
    const [grade, setGrade] = useState("Y");
    const [folded, setFolded] = useState(false);

    return (
        <div>
            <GroupTitle>공통 컴포넌트</GroupTitle>
            <Variants>
                <Variant
                    name="IconButton (작은 아이콘)"
                    source="common/input/IconButton.jsx · course · survey · test · code 등 여러 화면"
                    note="iconSize={16}. 화면 대부분의 작업 버튼"
                >
                    <IconButton icon={icons.add} iconSize={16}>추가</IconButton>
                    <IconButton icon={icons.ok} iconSize={16}>저장</IconButton>
                    <IconButton icon={icons.edit} iconSize={16}>수정</IconButton>
                    <IconButton icon={icons.delete} iconSize={16}>삭제</IconButton>
                    <IconButton icon={icons.close} iconSize={16}>취소</IconButton>
                    <IconButton icon={icons.refresh} iconSize={16} hoverIconRotate>다시 시도</IconButton>
                </Variant>
                <Variant
                    name="IconButton 상태"
                    source="common/input/IconButton.jsx"
                    note="disabled · 투명 배경 · 아이콘만 · 고정 폭(style)"
                >
                    <IconButton icon={icons.ok} iconSize={16} disabled>저장 중...</IconButton>
                    <IconButton icon={icons.add} iconSize={16} backgroundColor="transparent">투명</IconButton>
                    <IconButton icon={icons.setting} iconSize={16} />
                    <IconButton
                        icon={icons.download}
                        iconSize={16}
                        style={{ width: "130px", flexShrink: 0 }}
                    >
                        고정 폭 130px
                    </IconButton>
                </Variant>
                <Variant
                    name="Button (Input.jsx)"
                    source="common/input/Input.jsx · Sample.jsx"
                    note={'className="positive" | "negative" | 없음'}
                >
                    <Button text="기본" />
                    <Button text="positive" className="positive" />
                    <Button text="negative" className="negative" />
                </Variant>
            </Variants>

            <GroupTitle>화면별 버튼 (raw &lt;button&gt; + CSS)</GroupTitle>
            <Variants>
                <Variant
                    name="검색 · 등록 · 초기화 (36px)"
                    source="admin/system/member/MemberManagement.module.css"
                >
                    <button type="button" className={styles.btnSearch}>검색</button>
                    <button type="button" className={styles.btnReset}>초기화</button>
                    <button type="button" className={styles.btnCreate}>+ 회원 등록</button>
                </Variant>
                <Variant
                    name="보조 · 위험 (34px) / 작은 버튼 (30px)"
                    source="admin/system/member/MemberDetail.module.css"
                >
                    <button type="button" className={styles.btnSecondary}>수정</button>
                    <button type="button" className={styles.btnSecondary} disabled>비활성</button>
                    <button type="button" className={styles.btnDanger}>잠금 해제</button>
                    <button type="button" className={styles.btnSmall}>역할 변경</button>
                </Variant>
                <Variant
                    name="회색 납작 버튼 (29px)"
                    source="admin/system/access-role/AccessRole.module.css"
                >
                    <button type="button" className={styles.btnFlat}>✓ 전체 선택</button>
                    <button type="button" className={styles.btnFlat}>✓ 선택 해제</button>
                    <button type="button" className={styles.btnFlat} disabled>✓ 비활성</button>
                </Variant>
                <Variant
                    name="회색 테두리 버튼 (35px)"
                    source="admin/system/access/Access.module.css"
                >
                    <button type="button" className={styles.btnBordered}>등록</button>
                    <button type="button" className={styles.btnBordered}>수정</button>
                    <button type="button" className={styles.btnBordered}>초기화</button>
                </Variant>
                <Variant
                    name="전체 폭 제출 버튼 (38px)"
                    source="login/Login.module.css · my/info/MyInfoForm · MyPasswordForm"
                >
                    <button type="submit" className={styles.btnSubmit}>로그인</button>
                </Variant>
                <Variant name="뒤로 가기" source="my/course/MyCounsel.module.css (.backButton)">
                    <button type="button" className={styles.btnBack}>← 수강생 목록</button>
                </Variant>
                <Variant
                    name="진한 확인 / 밝은 취소"
                    source="admin/course/CourseTableComponent/ConfirmModal.jsx · ExamTakeModal · ExamGradeModal (인라인)"
                >
                    <button type="button" className={styles.btnDark}>확인</button>
                    <button type="button" className={styles.btnLight}>취소</button>
                </Variant>
                <Variant
                    name="선택형 채점 버튼"
                    source="admin/course/CourseTableComponent/ExamGradeModal.jsx (인라인)"
                    note="선택되면 채점 색으로 채움"
                >
                    {GRADES.map((g) => (
                        <button
                            key={g.key}
                            type="button"
                            className={styles.btnGrade}
                            style={
                                grade === g.key
                                    ? { backgroundColor: g.color, borderColor: g.color, color: "#fff" }
                                    : undefined
                            }
                            onClick={() => setGrade(g.key)}
                        >
                            {g.label}
                        </button>
                    ))}
                    <button type="button" className={styles.btnGrade} disabled style={{ color: "#bbb" }}>
                        비활성
                    </button>
                </Variant>
                <Variant name="텍스트 버튼" source="my/course/MyTimetable.module.css (.allTitle button)">
                    <button type="button" className={styles.btnText} onClick={() => setFolded((v) => !v)}>
                        {folded ? "[펼치기]" : "[접기]"}
                    </button>
                </Variant>
                <Variant name="사이드바 버튼 (어두운 배경)" source="menu/SideMenu.module.css (.retryBtn · .collapseBtn)">
                    <div className={styles.darkBox}>
                        <button type="button" className={styles.btnRetryDark}>다시 시도</button>
                        <button type="button" className={styles.collapseBtn}>‹</button>
                        <button type="button" className={styles.collapseBtn}>›</button>
                    </div>
                </Variant>
                <Variant
                    name="스타일 없는 기본 버튼"
                    source="HomeworkItem.jsx · MemberCreateModal.jsx · LogoutButton.jsx · MyCourse.jsx"
                    note="브라우저 기본 모양 그대로"
                >
                    <button type="button">저장</button>
                    <button type="button">취소</button>
                    <button type="button">로그아웃</button>
                </Variant>
            </Variants>
        </div>
    );
};
