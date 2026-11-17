import { useSyncExternalStore } from "react";

/*
 * 테마 (brand): 사이드바 색. 사용자가 고르고 앱 전체에 적용된다 (가이드 7장 "테마").
 * - 값은 <html data-brand="...">. CSS 값은 index.css의 :root[data-brand] (--brand-bg · --brand-accent).
 * - 이 브라우저의 localStorage에 기억. 새로고침 때 기본 색이 잠깐 보이지 않도록 index.html이 렌더링 전에 먼저 붙인다.
 * - 버튼 · 입력 · 상태색은 바뀌지 않는다 (그건 강조색 primary, 팀이 정함).
 *
 *   const [brand, setBrand] = useBrandTheme();
 *
 * 나중에 회원 설정으로 서버에 저장하려면 setBrand 안에서 API를 부르면 된다.
 */

export const BRAND_STORAGE_KEY = "lms-brand"; // index.html의 스크립트와 같은 키

/** swatch: 견본 배경(사이드바 색) · accent: 견본 가운데 점(현재 메뉴 색). index.css 값과 같게 */
export const BRANDS = [
  { id: "charcoal", label: "차콜 (기본)", swatch: "#212529", accent: "#ff6b6b" },
  { id: "navy", label: "네이비", swatch: "#1b2440", accent: "#91a7ff" },
  { id: "plum", label: "플럼", swatch: "#261d3d", accent: "#b197fc" },
  { id: "forest", label: "포레스트", swatch: "#11271f", accent: "#63e6be" },
  { id: "wine", label: "와인", swatch: "#33182a", accent: "#faa2c1" },
];

const DEFAULT_BRAND = "charcoal";
const isBrand = (value) => BRANDS.some((b) => b.id === value);

const listeners = new Set();

const readBrand = () => {
  const current = document.documentElement.dataset.brand;
  return isBrand(current) ? current : DEFAULT_BRAND;
};

const applyBrand = (brand) => {
  if (brand === DEFAULT_BRAND) delete document.documentElement.dataset.brand;
  else document.documentElement.dataset.brand = brand;
};

export const setBrand = (brand) => {
  const next = isBrand(brand) ? brand : DEFAULT_BRAND;
  applyBrand(next);
  try {
    localStorage.setItem(BRAND_STORAGE_KEY, next);
  } catch {
    /* 저장 못 해도 지금 화면에는 적용됨 */
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  // 다른 탭에서 바꾸면 이 탭도 따라감
  const onStorage = (event) => {
    if (event.key !== BRAND_STORAGE_KEY) return;
    applyBrand(isBrand(event.newValue) ? event.newValue : DEFAULT_BRAND);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
};

/** @returns {[string, (brand: string) => void]} */
export const useBrandTheme = () => [useSyncExternalStore(subscribe, readBrand), setBrand];
