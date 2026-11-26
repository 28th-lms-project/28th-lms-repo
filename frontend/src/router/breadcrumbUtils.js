/**
 * 브레드크럼 · 화면 제목 계산
 * 설계: frontend/docs/design/menu-page-design.md 7-3
 */
import { findGuardUrl, getGuardTarget } from "./routeUtils";

/** 끝의 "/"를 뗀다 ("/"는 그대로) */
const trimSlash = (url) => (url && url.length > 1 ? url.replace(/\/+$/, "") : url);

/**
 * 라우트 handle.crumb로 만든 항목 (메뉴에 없는 화면 · 메뉴 아래 상세 화면).
 * to는 넣지 않는다: 중간 라우트(예: "My Page")는 열 수 있는 화면이 아닐 수 있음
 */
const routeCrumb = (match) => ({ key: match.id, title: match.handle.crumb });

/**
 * menuId 메뉴부터 대메뉴까지의 이름을 대메뉴부터 (순환 데이터가 있어도 멈춘다).
 * URL이 있는 메뉴(소메뉴)만 to를 붙인다 → 표준 Breadcrumb에서 링크. URL이 없는 대 · 중메뉴는 글자
 */
const menuPathTitles = (menus, menuId) => {
  const byId = new Map(menus.map((menu) => [menu.id, menu]));
  const chain = [];
  let current = byId.get(menuId);
  while (current && !chain.includes(current)) {
    chain.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : null;
  }
  return chain.map((menu) => (menu.menuUrl ? { key: menu.id, title: menu.title, to: menu.menuUrl } : { key: menu.id, title: menu.title }));
};

/**
 * 바로 앞 항목과 이름이 같으면 하나로 합친다 (예: "설문 관리 > 설문 관리" → "설문 관리").
 * 둘 중 하나에 to가 있으면 그 to를 남긴다 (그룹 "설문 관리" + 소메뉴 "설문 관리" → 링크 하나)
 */
const collapseSameTitles = (crumbs) =>
  crumbs.reduce((result, crumb) => {
    const previous = result.at(-1);
    if (previous && previous.title === crumb.title) {
      if (!previous.to && crumb.to) result[result.length - 1] = { ...previous, to: crumb.to };
      return result;
    }
    result.push(crumb);
    return result;
  }, []);

/**
 * 브레드크럼 항목 (⌂ 다음부터). 마지막 항목이 화면 제목이 된다.
 * - 메뉴 화면: DB 메뉴 경로(대 > 중 > 소)의 이름. 메뉴 가드와 같은 방법(findGuardUrl)으로 소속 메뉴를 찾는다
 * - 메뉴 아래 상세 화면: 메뉴 경로 + 그보다 깊은 라우트의 crumb (예: "과정 상세")
 * - 메뉴에 없는 화면(로그인 · 404 · 등록 전 화면): 라우트 crumb
 * - 이어지는 같은 이름은 하나로 합친다
 *
 * @param {{ id: string, pathname: string, handle?: object }[]} matches useMatches() 결과
 * @param {string} pathname 현재 주소
 * @param {object[]} menus 내 메뉴 (menuSliceStore의 menus)
 * @param {string[]} guardUrls 모든 소메뉴 URL (menuSliceStore의 guardUrls)
 * @returns {{ key: string, title: string, to?: string }[]} to는 URL이 있는 메뉴에만 (마지막 항목은 Breadcrumb가 링크로 그리지 않음)
 */
export const buildBreadcrumbs = (matches, pathname, menus, guardUrls) => {
  const withCrumb = matches.filter((match) => match.handle?.crumb);
  const fromRoutes = withCrumb.map(routeCrumb);

  if (matches.some((match) => match.handle?.notFound)) {
    return fromRoutes;
  }

  // 대시보드("/")는 findGuardUrl의 후보에서 빠지므로 따로 찾는다
  const target = getGuardTarget(matches, pathname);
  const menuUrl = target === "/" ? "/" : findGuardUrl(guardUrls, target);
  const menu = menuUrl ? menus.find((item) => item.menuUrl === menuUrl) : null;
  if (!menu) {
    return collapseSameTitles(fromRoutes);
  }

  const deeper = withCrumb
    .filter((match) => {
      const matchPath = trimSlash(match.pathname);
      return menuUrl === "/" ? matchPath !== "/" : matchPath.startsWith(`${menuUrl}/`);
    })
    .map(routeCrumb);

  return collapseSameTitles([...menuPathTitles(menus, menu.id), ...deeper]);
};
