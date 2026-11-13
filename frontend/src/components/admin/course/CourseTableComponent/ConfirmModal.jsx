const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const boxStyle = {
  minWidth: "300px",
  maxWidth: "90vw",
  padding: "24px",
  backgroundColor: "#fff",
  borderRadius: "8px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
  textAlign: "center",
};

const messageStyle = {
  margin: "0 0 20px",
  fontSize: "15px",
  color: "#333",
};

const buttonAreaStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "8px",
};

const buttonStyle = {
  minWidth: "72px",
  padding: "8px 16px",
  fontSize: "14px",
  borderRadius: "4px",
  cursor: "pointer",
};

const confirmButtonStyle = {
  ...buttonStyle,
  border: "1px solid #333",
  backgroundColor: "#333",
  color: "#fff",
};

const cancelButtonStyle = {
  ...buttonStyle,
  border: "1px solid #ccc",
  backgroundColor: "#fff",
  color: "#333",
};

/**
 * 확인 / 취소 모달.
 * 바깥 어두운 영역을 클릭해도 취소로 처리한다.
 *
 * @param message 보여줄 문구
 * @param onConfirm [확인] 클릭
 * @param onCancel [취소] 또는 바깥 클릭
 */
export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={boxStyle} onClick={(event) => event.stopPropagation()}>
        <p style={messageStyle}>{message}</p>
        <div style={buttonAreaStyle}>
          <button type="button" style={confirmButtonStyle} onClick={onConfirm}>
            확인
          </button>
          <button type="button" style={cancelButtonStyle} onClick={onCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
