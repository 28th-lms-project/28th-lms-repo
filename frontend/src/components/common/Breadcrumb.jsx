import { Link, useMatches } from "react-router-dom";
import styles from "./Breadcrumb.module.css";

export default function Breadcrumb() {
  const crumbs = useMatches().filter((match) => match.handle?.crumb);
  return (
    <nav className={styles.breadcrumb}>
      <Link to="/">⌂</Link>
      {crumbs.map((m) => (
        <span key={m.id}> &gt; {m.handle.crumb}</span>
      ))}
    </nav>
  );
}
