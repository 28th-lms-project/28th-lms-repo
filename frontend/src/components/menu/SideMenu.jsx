import { NavLink } from "react-router-dom";
import styles from "./SideMenu.module.css";

export default function SideMenu() {
  return (
    <nav className={styles.sideMenu}>
      <h4 className={styles.listTitle}>Main</h4>
      <div className={styles.listItemTitle}>Home</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/">Dashboard</NavLink>
        </li>
      </ul>

      <h4 className={styles.listTitle}>My Page</h4>
      <div className={styles.listItemTitle}>수강 과정</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/my/course/list">수강 과정</NavLink>
        </li>
      </ul>

      <div className={styles.listItemTitle}>내 정보 수정</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/my/info">내 정보 수정</NavLink>
        </li>
      </ul>

      <h4 className={styles.listTitle}>System Management</h4>
      <div className={styles.listItemTitle}>과정 관리</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/admin/course" end>
            과정 목록
          </NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/course/add">과정 등록</NavLink>
        </li>
      </ul>

      <div className={styles.listItemTitle}>설문 관리</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/admin/survey">설문 관리</NavLink>
        </li>
      </ul>

      <div className={styles.listItemTitle}>시험 문제 관리</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/admin/test">시험 문제 관리</NavLink>
        </li>
      </ul>

      <div className={styles.listItemTitle}>수강생 관리</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/admin/students">수강생 목록</NavLink>
        </li>
      </ul>

      <div className={styles.listItemTitle}>시스템 관리</div>
      <ul className={styles.listSubmenu}>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/account">관리자 관리</NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/tutor">강사 관리</NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/menu">메뉴 관리</NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/role">권한 관리</NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/access">접근 권한 조회</NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/access-role">
            권한별 접근 권한 관리
          </NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/code">환경 변수 관리</NavLink>
        </li>
        <li className={styles.listItem}>
          <NavLink to="/admin/system/db">DB 관리</NavLink>
        </li>
      </ul>
    </nav>
  );
}
