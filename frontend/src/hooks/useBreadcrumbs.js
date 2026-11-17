import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useLocation, useMatches } from "react-router-dom";
import { selectGuardUrls, selectMyMenus } from "../store/slices/menuSliceStore";
import { buildBreadcrumbs } from "../router/breadcrumbUtils";

/**
 * 현재 화면의 브레드크럼 항목 (⌂ 다음부터). 마지막 항목이 화면 제목.
 * 메뉴 화면은 DB 메뉴 이름을 따르므로, 메뉴 관리에서 이름을 바꾸거나 옮기면 바로 반영된다.
 * 규칙: frontend/docs/design/menu-page-design.md 7-3
 *
 * 표준 PageHeader · Breadcrumb에 그대로 넘기면 URL이 있는 메뉴만 링크가 된다 (기존 common/Breadcrumb은 to를 쓰지 않음).
 *
 * @returns {{ key: string, title: string, to?: string }[]}
 */
export default function useBreadcrumbs() {
  const matches = useMatches();
  const { pathname } = useLocation();
  const menus = useSelector(selectMyMenus);
  const guardUrls = useSelector(selectGuardUrls);

  return useMemo(
    () => buildBreadcrumbs(matches, pathname, menus, guardUrls),
    [matches, pathname, menus, guardUrls],
  );
}
