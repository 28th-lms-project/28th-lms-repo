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
