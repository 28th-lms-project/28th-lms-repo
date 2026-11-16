/**
 * react-select를 표준 입력(.form-control)과 같은 모양으로 맞추는 styles.
 * 값은 모두 토큰(CSS 변수)이라 다크 모드 · 테마를 그대로 따른다.
 *
 *   import Select from "react-select";
 *   import { selectStyles } from "../common/ui/selectStyles";
 *   <Select styles={selectStyles} ... />
 *
 * 보통은 이 값을 미리 넣어 둔 common/ui/SelectBox.jsx를 쓴다.
 * 오류 표시는 aria-invalid (selectProps로 읽음).
 */
const invalid = (state) => state.selectProps["aria-invalid"] === true || state.selectProps["aria-invalid"] === "true";

export const selectStyles = {
  container: (base) => ({ ...base, minWidth: 0, fontSize: "var(--font-size-md)" }),
  control: (base, state) => ({
    ...base,
    minHeight: state.selectProps.size === "sm" ? "var(--control-height-sm)" : "var(--control-height-md)",
    backgroundColor: state.isDisabled ? "var(--color-bg-disabled)" : "var(--color-bg-surface)",
    borderColor: invalid(state)
      ? "var(--color-danger)"
      : state.isFocused
        ? "var(--color-focus)"
        : "var(--color-border)",
    borderRadius: "var(--radius)",
    boxShadow: state.isFocused
      ? `0 0 0 3px ${invalid(state) ? "var(--color-danger-bg)" : "var(--color-primary-light)"}`
      : "none",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    transition: "border-color 0.15s, box-shadow 0.15s",
    "&:hover": { borderColor: state.isFocused ? "var(--color-focus)" : "var(--color-border-strong)" },
  }),
  valueContainer: (base, state) => ({
    ...base,
    padding: state.selectProps.size === "sm" ? "0 var(--control-padding-x-sm)" : "2px var(--control-padding-x-md)",
  }),
  input: (base) => ({ ...base, margin: 0, padding: 0, color: "var(--color-text)" }),
  placeholder: (base) => ({ ...base, color: "var(--color-text-placeholder)" }),
  singleValue: (base, state) => ({
    ...base,
    color: state.isDisabled ? "var(--color-text-disabled)" : "var(--color-text)",
  }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base, state) => ({
    ...base,
    padding: "0 8px",
    color: state.isFocused ? "var(--color-text-secondary)" : "var(--color-text-placeholder)",
    "&:hover": { color: "var(--color-text-secondary)" },
  }),
  clearIndicator: (base) => ({
    ...base,
    padding: "0 4px",
    color: "var(--color-text-placeholder)",
    "&:hover": { color: "var(--color-danger)" },
  }),
  loadingIndicator: (base) => ({ ...base, color: "var(--color-text-placeholder)" }),
  menu: (base) => ({
    ...base,
    marginTop: 4,
    overflow: "hidden",
    backgroundColor: "var(--color-bg-surface)",
    border: "1px solid var(--color-border-light)",
    borderRadius: "var(--radius)",
    boxShadow: "var(--shadow-md)",
  }),
  menuList: (base) => ({ ...base, padding: 4 }),
  menuPortal: (base) => ({ ...base, zIndex: "calc(var(--z-modal) + 1)" }),
  option: (base, state) => ({
    ...base,
    padding: "8px 10px",
    borderRadius: "var(--radius)",
    color: state.isDisabled
      ? "var(--color-text-disabled)"
      : state.isSelected
        ? "var(--color-primary-text)"
        : "var(--color-text)",
    fontWeight: state.isSelected ? "var(--font-weight-semibold)" : "inherit",
    backgroundColor: state.isSelected
      ? "var(--color-primary-light)"
      : state.isFocused
        ? "var(--color-bg-hover)"
        : "transparent",
    cursor: state.isDisabled ? "not-allowed" : "pointer",
    "&:active": { backgroundColor: "var(--color-primary-light)" },
  }),
  noOptionsMessage: (base) => ({ ...base, color: "var(--color-text-muted)" }),
  loadingMessage: (base) => ({ ...base, color: "var(--color-text-muted)" }),
  groupHeading: (base) => ({
    ...base,
    fontSize: "var(--font-size-xs)",
    fontWeight: "var(--font-weight-semibold)",
    color: "var(--color-text-muted)",
  }),
  /* 다중 선택 칩: .tag와 같은 색 */
  multiValue: (base) => ({
    ...base,
    margin: "2px 4px 2px 0",
    backgroundColor: "var(--color-primary-light)",
    borderRadius: "var(--radius)",
  }),
  multiValueLabel: (base) => ({
    ...base,
    padding: "2px 6px",
    fontSize: "var(--font-size-sm)",
    color: "var(--color-primary-text)",
  }),
  multiValueRemove: (base) => ({
    ...base,
    color: "var(--color-primary-text)",
    borderRadius: "0 var(--radius) var(--radius) 0",
    "&:hover": { color: "var(--color-danger)", backgroundColor: "var(--color-danger-bg)" },
  }),
};
