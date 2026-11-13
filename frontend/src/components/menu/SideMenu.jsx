import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./SideMenu.module.css";
import UserProfile from "./UserProfile";
import IsLogin from "../login/IsLogin";
import {
  refreshMyMenus,
  selectMyMenus,
  selectMyMenuStatus,
} from "../../store/slices/menuSliceStore";
import { buildMenuTree, getCurrentGroupIds, isGroupOpen } from "./sideMenuUtils";

// 미사용 메뉴(SUPER_ADMIN만 받음)는 흐리게 표시하고 이름 뒤에 "(미사용)"
const titleOf = (menu) => (menu.useYn === "N" ? `${menu.title} (미사용)` : menu.title);

/**
 * 사이드바. 내 메뉴(GET /menus/me, menuSliceStore)를 그린다.
 * 설계: frontend/docs/design/menu-page-design.md 7장
 *
 * - 내 메뉴 조회는 MainLayout이 로그인 시 시작한다. 이 컴포넌트는 store 값을 읽기만 한다.
 * - 메뉴를 받는 중에는 메뉴 영역을 비워 둔다.
 * - 메뉴 관리에서 저장하면 refreshMyMenus로 다시 받아 바로 반영된다.
 */
export default function SideMenu() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const menuStatus = useSelector(selectMyMenuStatus);
  const myMenus = useSelector(selectMyMenus);

  const [collapsed, setCollapsed] = useState(false);

  const tree = useMemo(() => buildMenuTree(myMenus), [myMenus]);
  const currentGroupIds = getCurrentGroupIds(tree, pathname);

  // 사용자가 직접 펼치거나 접은 그룹만 기억한다 { 메뉴 ID: 펼침 여부 }. 새로고침하면 사라진다.
  // 조작하지 않은 그룹은 매번 규칙(DB spread · 현재 주소)으로 정한다 (isGroupOpen).
  // 계정이 바뀌거나 로그아웃하면 MainLayout이 key로 사이드바를 새로 만들어 함께 초기화된다.
  const [overrides, setOverrides] = useState({});

  // 페이지를 옮겼을 때 새 현재 그룹을 사용자가 접어 둔 상태면 그 기록만 지워, 지금 보고 있는 페이지의 링크가 보이게 한다.
  // 펼쳐 둔 기록은 남겨, 여러 그룹의 페이지를 오가도 다시 클릭하지 않게 한다.
  // (렌더 중 이전 값과 비교해 갱신: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    const closedCurrentIds = currentGroupIds.filter((id) => overrides[id] === false);
    if (closedCurrentIds.length > 0) {
      const next = { ...overrides };
      closedCurrentIds.forEach((id) => delete next[id]);
      setOverrides(next);
    }
  }

  function toggleGroup(group) {
    const isOpen = isGroupOpen(group, currentGroupIds.includes(group.id), overrides);
    setOverrides((prev) => ({ ...prev, [group.id]: !isOpen }));
  }

  let navClass = styles.sideMenu;
  let toggleLabel = "메뉴 접기";
  let collapseIcon = "‹";

  if (collapsed) {
    navClass += ` ${styles.collapsed}`;
    toggleLabel = "메뉴 펼치기";
    collapseIcon = "›";
  }

  return (
    <nav className={navClass}>
      {/* 상단 로고 & 접기 버튼 */}
      <div className={styles.header}>
        <div className={styles.logo}>
          Learning
          <br />
          Works
        </div>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setCollapsed((c) => !c)}
          aria-label={toggleLabel}
        >
          {collapseIcon}
        </button>
      </div>

      <div className={styles.menuBody}>
        {/* 로그인 상태 */}
        <IsLogin>
          <UserProfile />

          {menuStatus === "failed" && (
            <div className={styles.menuError}>
              <p>메뉴를 불러오지 못했습니다.</p>
              <button
                type="button"
                className={styles.retryBtn}
                onClick={() => dispatch(refreshMyMenus())}
              >
                다시 시도
              </button>
            </div>
          )}

          {menuStatus === "succeeded" &&
            tree.map(({ section, groups }) => (
              <div key={section.id}>
                <h4
                  className={`${styles.listTitle} ${section.useYn === "N" ? styles.unused : ""}`}
                >
                  {titleOf(section)}
                </h4>
                {groups.map(({ group, links }) => {
                  const isOpen = isGroupOpen(
                    group,
                    currentGroupIds.includes(group.id),
                    overrides,
                  );

                  let arrowClass = styles.arrow;
                  let submenuClass = styles.submenuWrap;
                  if (isOpen) {
                    arrowClass += ` ${styles.arrowOpen}`;
                    submenuClass += ` ${styles.submenuOpen}`;
                  }

                  return (
                    <div key={group.id}>
                      <button
                        type="button"
                        className={`${styles.listItemTitle} ${group.useYn === "N" ? styles.unused : ""}`}
                        onClick={() => toggleGroup(group)}
                        aria-expanded={isOpen}
                      >
                        <span className={arrowClass}>›</span>
                        {titleOf(group)}
                      </button>
                      <div className={submenuClass}>
                        <ul className={styles.listSubmenu}>
                          {links.map((link) => (
                            <li
                              key={link.id}
                              className={`${styles.listItem} ${link.useYn === "N" ? styles.unused : ""}`}
                            >
                              {/* end는 "/"만 (다른 메뉴는 하위 경로에서도 활성 표시) */}
                              <NavLink to={link.menuUrl} end={link.menuUrl === "/"}>
                                {titleOf(link)}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
        </IsLogin>
      </div>
    </nav>
  );
}
