import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { icons } from "../input/icons";
import Button from "./Button";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[contenteditable]:not([contenteditable="false"])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

// 열린 모달 순서. 맨 위 모달만 Esc · Tab을 처리한다 (모달 안에서 확인 창을 띄우는 경우)
const openStack = [];

const getFocusable = (root) =>
  Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);

/**
 * 모달. 스타일은 styles/modal.css. document.body에 portal로 그린다.
 *
 * 닫기 규칙: 기본은 Esc · 닫기(X) 버튼으로 닫힘, 바깥 클릭은 closeOnBackdrop일 때만 (폼 모달은 입력이 날아가므로 false).
 * 예외: 저장 중처럼 잠깐 닫히면 안 될 때는 dismissible={false} (Esc · X · 바깥 클릭 모두 막힘),
 *       시험 응시처럼 [제출]로만 닫혀야 하면 onClose를 넘기지 않음 (X 버튼도 없음).
 * 모달 안의 셀렉트 목록 등이 Esc를 먼저 처리했으면(preventDefault) 모달은 닫지 않는다.
 * 열리면 본문의 첫 입력(또는 initialFocusRef)에 포커스, Tab은 모달 안에서만 돌고, 닫히면 연 버튼으로 포커스가 돌아간다.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} [props.onClose]      없으면 X 버튼도 없음
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.summary]  제목 오른쪽 요약 ("문제 3개 · 총 30점")
 * @param {React.ReactNode} [props.description] 본문 맨 위 설명 (회색)
 * @param {"sm"|"md"|"lg"} [props.size="md"] sm 400 확인 · md 460 폼 · lg 800 내용
 * @param {React.ReactNode} [props.footer]  바닥 버튼들 (오른쪽 정렬)
 * @param {(event) => void} [props.onSubmit] 있으면 모달 전체가 <form>이 됨 → 바닥의 type="submit" 버튼 · Enter로 제출
 * @param {boolean} [props.dismissible=true]
 * @param {boolean} [props.closeOnBackdrop=false]
 * @param {{ current: HTMLElement }} [props.initialFocusRef]
 */
export default function Modal(props) {
  return props.open ? <ModalDialog {...props} /> : null;
}

function ModalDialog({
  onClose,
  title,
  summary,
  description,
  size = "md",
  footer,
  onSubmit,
  dismissible = true,
  closeOnBackdrop = false,
  initialFocusRef,
  className = "",
  children,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const pressedOnBackdrop = useRef(false);

  // 키보드 처리기가 항상 최신 onClose · dismissible을 보도록
  const latest = useRef({ onClose, dismissible });
  useEffect(() => {
    latest.current = { onClose, dismissible };
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    const token = {};
    openStack.push(token);

    const previousFocus = document.activeElement;
    const firstField = dialog.querySelector(`.modal-body :is(${FOCUSABLE})`);
    (initialFocusRef?.current ?? firstField ?? dialog).focus();

    const handleKeyDown = (event) => {
      if (openStack.at(-1) !== token) return;

      if (event.key === "Escape") {
        if (event.defaultPrevented) return; // 셀렉트 목록 닫기 등 안쪽에서 이미 처리한 Esc
        const { onClose: close, dismissible: canClose } = latest.current;
        if (close && canClose) {
          event.stopPropagation();
          close();
        }
        return;
      }

      if (event.key === "Tab") {
        const items = getFocusable(dialog);
        if (items.length === 0) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        // 포커스가 모달 밖에 있으면(저장 중 버튼이 비활성되어 body로 빠진 경우 등) 모달 안으로 되돌림
        if (!dialog.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
          return;
        }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      openStack.splice(openStack.indexOf(token), 1);
      if (previousFocus instanceof HTMLElement && document.contains(previousFocus)) {
        previousFocus.focus();
      }
    };
  }, [initialFocusRef]);

  // 바깥에서 누르고 바깥에서 뗐을 때만 닫음 (입력 칸에서 드래그하다 바깥에서 떼는 경우 방지)
  const handleBackdropMouseDown = (event) => {
    pressedOnBackdrop.current = event.target === event.currentTarget;
  };
  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && dismissible && onClose && pressedOnBackdrop.current && event.target === event.currentTarget) {
      onClose();
    }
  };

  const Container = onSubmit ? "form" : "div";
  const formProps = onSubmit
    ? {
        onSubmit: (event) => {
          event.preventDefault();
          onSubmit(event);
        },
      }
    : {};

  return createPortal(
    <div className="modal-overlay" onMouseDown={handleBackdropMouseDown} onClick={handleBackdropClick}>
      <Container
        ref={dialogRef}
        className={["modal", size === "sm" ? "modal-sm" : "", size === "lg" ? "modal-lg" : "", className]
          .filter(Boolean)
          .join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        {...formProps}
      >
        <div className="modal-header">
          <h2 id={titleId} className="modal-title">
            {title}
          </h2>
          {summary && <span className="modal-summary">{summary}</span>}
          {onClose && (
            <Button
              variant="text"
              icon={icons.close}
              className="modal-close"
              aria-label="닫기"
              title="닫기"
              disabled={!dismissible}
              onClick={onClose}
            />
          )}
        </div>
        <div className="modal-body">
          {description && <p className="modal-description">{description}</p>}
          {children}
        </div>
        {footer && <div className="modal-footer">{footer}</div>}
      </Container>
    </div>,
    document.body,
  );
}
