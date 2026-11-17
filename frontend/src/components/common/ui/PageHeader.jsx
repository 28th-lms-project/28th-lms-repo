import { Link } from "react-router-dom";
import { icons } from "../input/icons";
import SvgIcon from "./SvgIcon";

/**
 * 화면 머리: 브레드크럼 + 제목 + (설명) + (오른쪽 버튼). 스타일은 styles/nav.css.
 * 기존 PageContainer의 머리를 대신할 표준 모양 (옮기는 것은 다음 단계).
 *
 * @param {object} props
 * @param {{ key?: string, title: string, to?: string }[]} [props.crumbs]
 *   홈 다음부터. 마지막 항목은 현재 화면 (링크 없음). to가 없으면 글자만
 * @param {React.ReactNode} props.title
 * @param {React.ReactNode} [props.description]
 * @param {React.ReactNode} [props.actions]
 */
export default function PageHeader({ crumbs = [], title, description, actions }) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {crumbs.length > 0 && <Breadcrumb crumbs={crumbs} />}
        <h2 className="page-title">{title}</h2>
        {description && <p className="page-description">{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

/** 브레드크럼만 따로 쓸 때 */
export function Breadcrumb({ crumbs }) {
  return (
    <nav aria-label="현재 위치">
      <ol className="breadcrumb">
        <li>
          <Link to="/" aria-label="홈">
            <SvgIcon path={icons.home} size={15} />
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <li key={crumb.key ?? crumb.title} aria-current={last ? "page" : undefined}>
              {!last && crumb.to ? <Link to={crumb.to}>{crumb.title}</Link> : crumb.title}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
