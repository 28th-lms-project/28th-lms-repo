import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MainRouterProvider from "./router/MainRouterProvider.jsx";
import StoreProvider from "./store/slices/StoreProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StoreProvider>
      <MainRouterProvider />
    </StoreProvider>
  </StrictMode>,
);
