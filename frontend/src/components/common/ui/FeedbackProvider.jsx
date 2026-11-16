import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { icons } from "../input/icons";
import ConfirmDialog from "./ConfirmDialog";
import { ConfirmContext, ToastContext } from "./feedbackContext";
import SvgIcon from "./SvgIcon";

const MAX_TOASTS = 3;
const DURATION = { info: 2500, success: 2500, error: 4000 };
const TOAST_ICON = { success: icons.ok, error: icons.error };

/**
 * 토스트 · 확인 창을 앱 어디서나 쓸 수 있게 하는 provider (main.jsx에서 한 번 감쌈).
 * 쓰는 쪽은 feedbackContext.js의 useToast() · useConfirm().
 */
export default function FeedbackProvider({ children }) {
  /* ───── 토스트 ───── */
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (type, message, { duration } = {}) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((list) => [...list, { id, type, message }].slice(-MAX_TOASTS));
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration ?? DURATION[type]),
      );
      return id;
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({
      show: (message, options) => show("info", message, options),
      success: (message, options) => show("success", message, options),
      error: (message, options) => show("error", message, options),
      dismiss,
    }),
    [show, dismiss],
  );

  useEffect(() => {
    const timerMap = timers.current;
    return () => timerMap.forEach((timer) => clearTimeout(timer));
  }, []);

  /* ───── 확인 창 ───── */
  const [confirmOptions, setConfirmOptions] = useState(null);
  const pendingResolve = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        // 이미 떠 있는 확인 창이 있으면 취소로 끝냄
        pendingResolve.current?.(false);
        pendingResolve.current = resolve;
        setConfirmOptions(typeof options === "string" ? { message: options } : options);
      }),
    [],
  );

  const settle = (result) => {
    pendingResolve.current?.(result);
    pendingResolve.current = null;
    setConfirmOptions(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <ConfirmDialog
          open={confirmOptions !== null}
          {...confirmOptions}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />

        {createPortal(
          <div className="toast-region" role="status" aria-live="polite">
            {toasts.map((item) => (
              <div
                key={item.id}
                className={`toast ${item.type === "error" ? "toast-error" : ""}`.trim()}
                role={item.type === "error" ? "alert" : undefined}
                title="누르면 닫힙니다"
                onClick={() => dismiss(item.id)}
              >
                {TOAST_ICON[item.type] && <SvgIcon path={TOAST_ICON[item.type]} size={16} />}
                {item.message}
              </div>
            ))}
          </div>,
          document.body,
        )}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
