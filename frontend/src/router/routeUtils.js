/**
 * 라우트 트리 관련 함수
 * 설계: frontend/docs/design/menu-page-design.md 5장
 */

/** 부모 경로와 자식 경로를 합친다. 결과는 "/"로 시작하고, 끝에 "/"가 없다 (루트는 "/") */
const joinPath = (parentPath, path) => {
  if (!path) return parentPath;
  const joined = path.startsWith("/") ? path : `${parentPath.replace(/\/$/, "")}/${path}`;
  return joined.length > 1 ? joined.replace(/\/+$/, "") : joined;
};

/**
 * 메뉴로 고를 수 있는 URL 목록. 라우트의 handle.menu가 true인 경로를 모은다.
 * - index 라우트는 상위 경로로 계산한다 (대시보드는 "/")
 * - 파라미터(":id")가 있는 경로는 제외한다
 * - label: 그 라우트의 crumb, 없으면 가장 가까운 상위 라우트의 crumb
 *
 * @param {object[]} routes createBrowserRouter에 넘기는 라우트 배열
 * @returns {{ url: string, label: string }[]} 라우트 순서대로
 */
export const getMenuUrlOptions = (routes) => {
  const options = [];

  const walk = (children, parentPath, parentCrumb) => {
    (children ?? []).forEach((route) => {
      const fullPath = route.index ? parentPath : joinPath(parentPath, route.path);
      const crumb = route.handle?.crumb ?? parentCrumb;

      if (route.handle?.menu && !fullPath.includes(":")) {
        options.push({ url: fullPath, label: crumb ?? fullPath });
      }
      walk(route.children, fullPath, crumb);
    });
  };

  walk(routes, "/", null);

  // 같은 URL이 두 번 표시된 경우 첫 번째만
  return options.filter(
    (option, index) => options.findIndex((other) => other.url === option.url) === index,
  );
};

/** 끝의 "/"를 뗀다 ("/"는 그대로) */
const trimSlash = (url) => (url.length > 1 ? url.replace(/\/+$/, "") : url);

/**
 * 가드가 판정할 URL. 일치한 라우트 중 가장 안쪽의 handle.guardAs, 없으면 현재 주소.
 * 설계: menu-page-design.md 5-3의 5번
 *
 * @param {{ handle?: object }[]} matches useMatches() 결과 (바깥 → 안쪽 순)
 * @param {string} pathname
 */
export const getGuardTarget = (matches, pathname) => {
  const guardAs = matches.findLast((match) => match.handle?.guardAs)?.handle.guardAs;
  return trimSlash(guardAs ?? pathname);
};

/**
 * URL이 속한 메뉴 URL. guardUrls 중 URL과 같거나 URL이 "메뉴URL/"로 시작하는 것 중 가장 긴 것.
 * - "/" 경계 검사: /admin/system/access-role은 /admin/system/access에 속하지 않는다
 * - "/"는 모든 URL에 걸리므로 후보에서 뺀다 (가드가 "/"를 먼저 통과시킴)
 * 설계: menu-page-design.md 5-3의 6번
 *
 * @param {string[]} guardUrls GET /menus/me의 guardUrls (모든 소메뉴 URL, 미사용 · 미허용 포함)
 * @param {string} url getGuardTarget 결과
 * @returns {string | null} 찾지 못하면 null
 */
export const findGuardUrl = (guardUrls, url) =>
  guardUrls
    .filter((menuUrl) => menuUrl && menuUrl !== "/")
    .map(trimSlash)
    .filter((menuUrl) => url === menuUrl || url.startsWith(`${menuUrl}/`))
    .reduce((longest, menuUrl) => (longest && longest.length >= menuUrl.length ? longest : menuUrl), null);
