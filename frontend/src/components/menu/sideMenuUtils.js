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
 * 처음 펼칠 그룹의 메뉴 ID: spread = 'Y'인 그룹 + 현재 주소가 들어 있는 그룹
 * @param {ReturnType<typeof buildMenuTree>} tree
 * @param {string} pathname
 * @returns {string[]}
 */
export const getInitialOpenGroupIds = (tree, pathname) =>
  tree
    .flatMap(({ groups }) => groups)
    .filter(
      ({ group, links }) =>
        group.spread === "Y" || links.some((link) => isActiveUrl(link.menuUrl, pathname)),
    )
    .map(({ group }) => group.id);
