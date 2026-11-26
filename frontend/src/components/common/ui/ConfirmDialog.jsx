import { useRef } from "react";
import Button from "./Button";
import Modal from "./Modal";

/**
 * 확인 창 (작은 모달). 보통은 useConfirm()으로 쓰고, 화면에서 상태로 직접 다룰 때만 이 컴포넌트를 쓴다.
 * 바깥 클릭 · Esc = 취소. danger면 확인 버튼이 빨강이고, 실수로 Enter를 눌러도 지워지지 않게 취소 버튼에 포커스.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} [props.title="확인"]
 * @param {React.ReactNode} props.message   줄바꿈(\n) 유지
 * @param {string} [props.confirmText="확인"]
 * @param {string} [props.cancelText="취소"]
 * @param {boolean} [props.danger]
 * @param {boolean} [props.loading]         확인 처리 중 (버튼 로딩 · 닫기 막힘)
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export default function ConfirmDialog({
  open,
  title = "확인",
  message,
  confirmText = "확인",
  cancelText = "취소",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);
  const cancelRef = useRef(null);

  return (
    <Modal
      open={open}
      size="sm"
      title={title}
      onClose={onCancel}
      closeOnBackdrop
      dismissible={!loading}
      initialFocusRef={danger ? cancelRef : confirmRef}
      footer={
        <>
          <Button ref={cancelRef} onClick={onCancel} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            ref={confirmRef}
            variant={danger ? "danger-solid" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="modal-message">{message}</p>
    </Modal>
  );
}
