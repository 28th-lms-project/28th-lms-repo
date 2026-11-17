import { createContext, useContext } from "react";

export const ToastContext = createContext(null);
export const ConfirmContext = createContext(null);

/**
 * 토스트 (alert() 대신). FeedbackProvider(main.jsx) 안에서만 쓸 수 있다.
 *
 *   const toast = useToast();
 *   toast.success("저장했습니다.");
 *   toast.error(getErrorMessage(error));   // 요청 실패
 *   toast.show("복사했습니다.");            // 아이콘 없는 기본
 *
 * 성공 · 기본은 2.5초, 오류는 4초 뒤 사라지고, 누르면 바로 닫힌다. 한 번에 3개까지.
 * 세 함수 모두 두 번째 인자로 { duration: 밀리초 }를 받는다.
 */
export const useToast = () => {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast는 FeedbackProvider 안에서 써야 합니다.");
  return toast;
};

/**
 * 확인 창 (window.confirm 대신). 결과를 Promise<boolean>으로 돌려준다.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ message: "삭제할까요?", danger: true, confirmText: "삭제" }))) return;
 *   if (!(await confirm("저장할까요?"))) return;   // 문구만
 *
 * 옵션: title · message · confirmText · cancelText · danger (ConfirmDialog와 같음)
 */
export const useConfirm = () => {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm은 FeedbackProvider 안에서 써야 합니다.");
  return confirm;
};
