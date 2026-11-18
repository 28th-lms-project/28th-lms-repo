/* 기록용: 샘플 "표준화 전 (기록)" 탭의 카탈로그. 표준화 전 모습을 남긴 것이라 새 예시를 더하지 않음 (표준 예시는 catalog/의 Standard*). */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "../Catalog.module.css";
import { Variant, Variants } from "../CatalogParts.jsx";
import { IconButton } from "../../../common/input/IconButton.jsx";
import { icons } from "../../../common/input/icons.js";

/** 바깥 클릭 · Esc로 닫는 오버레이 (RoleUserMoveModal 방식) */
const Overlay = ({ onClose, children }) => {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    return createPortal(
        <div
            className={styles.modalOverlay}
            data-color-scheme="light"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {children}
        </div>,
        document.body,
    );
};

export const OverlayCatalog = () => {
    const [open, setOpen] = useState(null);
    const close = () => setOpen(null);

    return (
        <div>
            <Variants>
                <Variant
                    name="폼 모달 (max-width 460px)"
                    source="admin/system/member/MemberCreateModal.jsx · MemberFormModal · MemberPasswordResetModal (MemberModal.module.css)"
                    note="원본은 바깥 클릭으로 닫히지 않음"
                >
                    <IconButton icon={icons.add} iconSize={16} onClick={() => setOpen("form")}>회원 등록 모달</IconButton>
                </Variant>
                <Variant
                    name="확인 모달 (가운데 정렬)"
                    source="admin/course/CourseTableComponent/ConfirmModal.jsx (인라인)"
                    note="바깥 클릭 = 취소"
                >
                    <IconButton icon={icons.delete} iconSize={16} onClick={() => setOpen("confirm")}>삭제 확인 모달</IconButton>
                </Variant>
                <Variant
                    name="큰 내용 모달 (800px · 88vh)"
                    source="ExamQuestionViewModal.jsx · ExamTakeModal · ExamGradeModal (900px)"
                    note="머리(제목 + 요약) · 스크롤 본문 · 바닥 버튼"
                >
                    <IconButton icon={icons.full} iconSize={16} onClick={() => setOpen("large")}>문제 보기 모달</IconButton>
                </Variant>
                <Variant
                    name="Alert · Confirm 컴포넌트"
                    source="sample/Modal.jsx · admin/system/menu/Menu.jsx"
                    note="ref.current.open()으로 엶. 아래 'Sample Modals' 섹션에 예시가 있음"
                >
                    <span className={styles.hint12}>표준: common/ui/Modal · useConfirm (표준 UI 섹션)</span>
                </Variant>
                <Variant
                    name="팝업 창"
                    source="admin/course/CourseTableComponent/HomeWorkList.jsx"
                    note={'window.open("/popup/homework/...", "homeworkDetail", "width=1620,height=1080")'}
                >
                    <span className={styles.hint12}>모달 대신 새 창 (예시 생략)</span>
                </Variant>
            </Variants>

            {open === "form" && (
                <Overlay onClose={close}>
                    <form className={styles.modal} onSubmit={(e) => { e.preventDefault(); close(); }}>
                        <h3 className={styles.modalTitle}>회원 등록</h3>
                        <div className={styles.modalContent}>
                            <p className={styles.modalDescription}>초기 비밀번호는 아이디와 같습니다.</p>
                            <label className={styles.field}>
                                <span>아이디</span>
                                <input placeholder="영문 · 숫자" autoFocus />
                            </label>
                            <label className={styles.field}>
                                <span>역할</span>
                                <select>
                                    <option>학생</option>
                                    <option>강사</option>
                                </select>
                            </label>
                        </div>
                        <div className={styles.modalButtons}>
                            <button type="button" className={styles.btnSecondary} onClick={close}>취소</button>
                            <button type="submit" className={styles.btnCreate}>등록</button>
                        </div>
                    </form>
                </Overlay>
            )}

            {open === "confirm" && (
                <Overlay onClose={close}>
                    <div className={styles.confirmBox} role="dialog" aria-modal="true">
                        <p className={styles.confirmMessage}>이 시험을 삭제할까요?</p>
                        <div className={styles.confirmButtons}>
                            <button type="button" className={styles.btnDark} onClick={close}>확인</button>
                            <button type="button" className={styles.btnLight} onClick={close}>취소</button>
                        </div>
                    </div>
                </Overlay>
            )}

            {open === "large" && (
                <Overlay onClose={close}>
                    <div className={styles.largeModal} role="dialog" aria-modal="true">
                        <div className={styles.largeModalHeader}>
                            <h3 className={styles.largeModalTitle}>Java 기초 시험</h3>
                            <span className={styles.largeModalSummary}>문제 3개 · 총 30점</span>
                        </div>
                        <div className={styles.largeModalBody}>
                            {[1, 2, 3].map((n) => (
                                <div key={n} className={styles.question}>
                                    <div className={styles.questionTitle}>
                                        <span>{n}. 문제 제목</span>
                                        <span className={styles.questionMeta}>객관식 · 10점</span>
                                    </div>
                                    <div className={styles.subQuestion}>문제 본문 · 보기</div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.largeModalFooter}>
                            <button type="button" className={styles.btnLight} onClick={close}>닫기</button>
                        </div>
                    </div>
                </Overlay>
            )}
        </div>
    );
};
