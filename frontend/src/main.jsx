import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 본문 글꼴: Pretendard 가변 글꼴, 동적 서브셋 (화면에 나온 글자 묶음만 내려받음)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./index.css";
import MainRouterProvider from "./router/MainRouterProvider.jsx";

import StoreProvider from "./store/StoreProvider.jsx";
// 토스트(useToast) · 확인 창(useConfirm)
import FeedbackProvider from "./components/common/ui/FeedbackProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StoreProvider>
      <FeedbackProvider>
        <MainRouterProvider />
      </FeedbackProvider>
    </StoreProvider>
  </StrictMode>,
);
