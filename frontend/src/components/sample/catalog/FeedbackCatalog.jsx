import { useEffect, useState } from "react";
import styles from "./Catalog.module.css";
import { GroupTitle, Variant, Variants } from "./CatalogParts.jsx";
import { IconButton } from "../../common/input/IconButton.jsx";
import { icons } from "../../common/input/icons.js";

export const FeedbackCatalog = () => {
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = setTimeout(() => setToast(null), 2000);
        return () => clearTimeout(timer);
    }, [toast]);

    return (
        <div>
            <GroupTitle>배지 · 태그</GroupTitle>
            <Variants>
                <Variant name="상태 배지" source="admin/system/member/MemberDetail.jsx (.badgeNormal · .badgeLocked)">
                    <span className={`${styles.badge} ${styles.badgeNormal}`}>정상</span>
                    <span className={`${styles.badge} ${styles.badgeLocked}`}>계정 잠김</span>
                </Variant>
                <Variant name="등급 배지" source="my/course/MyCounsel.jsx (.levelBadge)">
                    <span className={`${styles.levelBadge} ${styles.levelHigh}`}>상</span>
                    <span className={`${styles.levelBadge} ${styles.levelMid}`}>중</span>
                    <span className={`${styles.levelBadge} ${styles.levelLow}`}>하</span>
                    <span className={`${styles.levelBadge} ${styles.levelNone}`}>미진단</span>
                </Variant>
                <Variant name="태그 칩" source="my/course/MyCounsel.jsx (.typeTag)">
                    <span className={styles.tag}>학습</span>
                    <span className={styles.tag}>진로</span>
                </Variant>
                <Variant name="채점 결과 글자" source="admin/course/CourseTableComponent/ExamGradeModal.jsx (GRADE_LABELS)">
                    <span className={styles.gradeY}>정답</span>
                    <span className={styles.gradeN}>오답</span>
                    <span className={styles.gradeH}>부분정답</span>
                    <span className={styles.gradeR}>채점 중</span>
                </Variant>
            </Variants>

            <GroupTitle>안내 상자 · 빈 상태 · 로딩</GroupTitle>
            <Variants>
                <Variant
                    name="안내 상자 (권한 확인 · 권한 없음 · 불러오기 실패)"
                    source="Access · AccessRole (.notice, 각각 복사됨)"
                    block
                >
                    <p className={styles.notice}>권한이 없습니다.</p>
                </Variant>
                <Variant name="점선 빈 상태" source="admin/system/member/MemberManagement.module.css (.emptyNotice)" block>
                    <div className={styles.emptyDashed}>검색 결과가 없습니다.</div>
                </Variant>
                <Variant name="가운데 빈 상태 (min-height 100px)" source="admin/system/access-role/AccessRole.module.css (.empty)" block>
                    <div className={styles.emptyFlex}>역할을 선택하세요.</div>
                </Variant>
                <Variant name="작은 안내 문구 (12px)" source="MyCourseData · MyInterview · MyTimetable · MyCounsel (.emptyMessage · .loading)">
                    <p className={styles.smallMessage}>등록된 자료가 없습니다.</p>
                    <p className={styles.smallMessage}>불러오는 중...</p>
                </Variant>
                <Variant name="로딩 문구 (가운데)" source="my/info/MyInfoForm.module.css (.loadingText)" block>
                    <div className={styles.loadingText}>내 정보를 불러오는 중입니다...</div>
                </Variant>
                <Variant name="진행 중 아이콘 · 버튼 문구 바꾸기" source="Sample.jsx · 여러 화면" note={'저장 중에는 버튼을 disabled + "저장 중..."'}>
                    <IconButton icon={icons.progress} iconSize={16} alwaysIconRotate>불러오는 중</IconButton>
                    <IconButton icon={icons.ok} iconSize={16} disabled>저장 중...</IconButton>
                </Variant>
            </Variants>

            <GroupTitle>오류 · 성공 · 힌트 문구</GroupTitle>
            <Variants>
                <Variant
                    name="필드 오류 문구 (5가지)"
                    source="MyInfoForm · AddTest · MyCourseData · MyCounsel · HomeworkItem"
                    note="색 · 크기가 화면마다 다름 → 하나로 통일 필요"
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <p className={styles.errorRem}>.8rem #dc3545 — my/info, member 모달</p>
                        <p className={styles.errorAlert}>.875rem #b42318 — admin/test</p>
                        <p className={styles.errorSmall}>12px #c62828 — MyCourseData, MyInterview</p>
                        <p className={styles.error13}>13px #c62828 — my/course (.error)</p>
                        <p className={styles.errorInline}>12px #d93025 — HomeworkItem 마감 안내</p>
                    </div>
                </Variant>
                <Variant name="성공 메시지" source="my/info/MyInfoForm · MyPasswordForm (.successMessage)" block>
                    <div className={styles.success}>정보가 수정되었습니다.</div>
                </Variant>
                <Variant name="힌트 문구" source="MyCounsel (.guide)">
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <p className={styles.guide13}>13px #555 — 상담 내용은 수강생에게 보이지 않습니다.</p>
                    </div>
                </Variant>
            </Variants>

            <GroupTitle>경고 · 알림 바 · 토스트</GroupTitle>
            <Variants>
                <Variant name="점선 주의 상자" source="my/course/MyCounsel.module.css (.notice)" block>
                    <div className={styles.calloutDashed}>저장하지 않은 내용이 있습니다.</div>
                </Variant>
                <Variant name="토스트 (2초 후 사라짐)" source="my/course/MyCourseData.jsx (.toast · .toastError)">
                    <IconButton iconSize={16} icon={icons.ok} onClick={() => setToast({ text: "저장했습니다.", error: false })}>
                        성공 토스트
                    </IconButton>
                    <IconButton iconSize={16} icon={icons.error} onClick={() => setToast({ text: "저장하지 못했습니다.", error: true })}>
                        오류 토스트
                    </IconButton>
                    {toast && (
                        <div
                            className={`${styles.toast} ${toast.error ? styles.toastError : ""}`}
                            role={toast.error ? "alert" : "status"}
                        >
                            {toast.text}
                        </div>
                    )}
                </Variant>
                <Variant name="건수 표시" source="AccessRole (.count) · MyCourseData (.totalCount)">
                    <div className={styles.countFooter}>허용 권한 12건 / 3건 선택</div>
                    <span className={styles.totalCount}>전체 37건</span>
                </Variant>
                <Variant name="브라우저 alert / confirm" source="Member · Code · course/* 여러 곳" note="성공 · 실패를 window.alert로 알리는 곳이 많음">
                    <IconButton iconSize={16} icon={icons.ok} onClick={() => window.alert("저장되었습니다.")}>alert()</IconButton>
                </Variant>
            </Variants>

        </div>
    );
};
