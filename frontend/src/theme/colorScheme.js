import { useSyncExternalStore } from "react";

/*
 * 다크 모드: 앱 전체 (가이드 9장).
 * - 값은 <html data-color-scheme="dark">. 토큰 값은 index.css의 [data-color-scheme="dark"].
 * - 이 브라우저의 localStorage에 기억. 새로고침 때 밝은 색이 잠깐 보이지 않도록 index.html이 렌더링 전에 먼저 붙인다.
 * - 기본은 밝은 모드 (시스템 설정을 따르지 않음).
 * - 모든 화면이 따른다 (2026-11-19에 화면별 darkReady 표시와 MainLayout의 밝은 섬을 지움).
 *
 *   const [scheme, setColorScheme] = useColorScheme();   // "light" | "dark"
 */

export const COLOR_SCHEME_KEY = "lms-color-scheme"; // index.html의 스크립트와 같은 키

const listeners = new Set();

const readScheme = () => (document.documentElement.dataset.colorScheme === "dark" ? "dark" : "light");

const applyScheme = (scheme) => {
  if (scheme === "dark") document.documentElement.dataset.colorScheme = "dark";
  else delete document.documentElement.dataset.colorScheme;
};

export const setColorScheme = (scheme) => {
  const next = scheme === "dark" ? "dark" : "light";
  applyScheme(next);
  try {
    localStorage.setItem(COLOR_SCHEME_KEY, next);
  } catch {
    /* 저장 못 해도 지금 화면에는 적용됨 */
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  // 다른 탭에서 바꾸면 이 탭도 따라감
  const onStorage = (event) => {
    if (event.key !== COLOR_SCHEME_KEY) return;
    applyScheme(event.newValue === "dark" ? "dark" : "light");
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

/** @returns {["light"|"dark", (scheme: "light"|"dark") => void]} */
export const useColorScheme = () => [useSyncExternalStore(subscribe, readScheme), setColorScheme];
