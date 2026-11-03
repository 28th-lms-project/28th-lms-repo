import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MainRouterProvider from "./router/MainRouterProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MainRouterProvider />
  </StrictMode>,
);
