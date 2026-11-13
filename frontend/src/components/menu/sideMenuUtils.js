/**
 * 사이드바 메뉴 계산
 * 설계: frontend/docs/design/menu-page-design.md 7-2
 */

const byMenuOrder = (a, b) => a.menuOrder - b.menuOrder || a.id.localeCompare(b.id);

const childrenOf = (menus, parentId) =>
  menus.filter((menu) => (menu.parentId ?? null) === parentId).sort(byMenuOrder);

/**
 * 내 메뉴(평평한 목록)를 대(섹션) → 중(그룹) → 소(링크) 트리로 만든다. menuOrder 순.
 * 소메뉴가 하나도 없는 중메뉴, 중메뉴가 하나도 없는 대메뉴는 뺀다 (그릴 링크가 없으므로).
 *
 * @param {object[]} menus GET /menus/me의 menus
 * @returns {{ section: object, groups: { group: object, links: object[] }[] }[]}
 */
export const buildMenuTree = (menus) =>
  childrenOf(menus, null)
    .map((section) => ({
      section,
      groups: childrenOf(menus, section.id)
        .map((group) => ({ group, links: childrenOf(menus, group.id) }))
        .filter(({ links }) => links.length > 0),
    }))
    .filter(({ groups }) => groups.length > 0);

/**
 * 링크가 현재 주소에 해당하는지.
 * "/"는 정확히 같을 때만. 그 외에는 같거나 "URL/"로 시작할 때 (/admin/system/access-role이 /admin/system/access에 걸리지 않게)
 */
export const isActiveUrl = (menuUrl, pathname) => {
  if (!menuUrl) return false;
  if (menuUrl === "/") return pathname === "/";
  return pathname === menuUrl || pathname.startsWith(`${menuUrl}/`);
};

/**
 * 현재 주소의 링크가 들어 있는 그룹의 메뉴 ID
 * @param {ReturnType<typeof buildMenuTree>} tree
 * @param {string} pathname
 * @returns {string[]}
 */
export const getCurrentGroupIds = (tree, pathname) =>
  tree
    .flatMap(({ groups }) => groups)
    .filter(({ links }) => links.some((link) => isActiveUrl(link.menuUrl, pathname)))
    .map(({ group }) => group.id);

/**
 * 그룹을 펼칠지 정한다.
 * - 사용자가 직접 펼치거나 접은 그룹: 마지막으로 조작한 상태
 * - 그 외: DB의 spread = 'Y'이거나 현재 주소가 든 그룹이면 펼침
 *
 * 페이지를 옮기면 새 현재 그룹의 조작 기록을 지우므로(SideMenu), 지금 보고 있는 페이지의 링크는 이동 직후 항상 보인다.
 *
 * @param {object} group 중메뉴
 * @param {boolean} isCurrent 현재 주소가 든 그룹인지
 * @param {Record<string, boolean>} overrides 사용자가 조작한 그룹 { 메뉴 ID: 펼침 여부 }
 */
export const isGroupOpen = (group, isCurrent, overrides) =>
  group.id in overrides ? overrides[group.id] : group.spread === "Y" || isCurrent;
