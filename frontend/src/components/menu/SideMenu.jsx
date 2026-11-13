import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./SideMenu.module.css";
import UserProfile from "./UserProfile";
import IsLogin from "../login/IsLogin";
import { selectUser } from "../../store/slices/loginSliceStore";
import {
  refreshMyMenus,
  selectMyMenus,
  selectMyMenuStatus,
} from "../../store/slices/menuSliceStore";
import { buildMenuTree, getInitialOpenGroupIds } from "./sideMenuUtils";

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
  const user = useSelector(selectUser);
  const menuStatus = useSelector(selectMyMenuStatus);
  const myMenus = useSelector(selectMyMenus);

  const [collapsed, setCollapsed] = useState(false);

  // 사용자가 그룹을 펼치거나 접은 뒤의 상태 (메뉴 ID). 사용자별로 기억하고,
  // 아직 건드리지 않았으면 null → 처음 펼칠 그룹(spread · 현재 주소)을 쓴다
  const [openState, setOpenState] = useState({ userId: null, groupIds: null });

  const tree = useMemo(() => buildMenuTree(myMenus), [myMenus]);

  const openGroupIds =
    openState.userId === user?.id && openState.groupIds !== null
      ? openState.groupIds
      : getInitialOpenGroupIds(tree, pathname);

  function toggleGroup(groupId) {
    const next = openGroupIds.includes(groupId)
      ? openGroupIds.filter((id) => id !== groupId)
      : [...openGroupIds, groupId];
    setOpenState({ userId: user?.id, groupIds: next });
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
                  const isOpen = openGroupIds.includes(group.id);

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
                        onClick={() => toggleGroup(group.id)}
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
