import { useState } from "react";
import PageHeader from "../../common/ui/PageHeader";
import useBreadcrumbs from "../../../hooks/useBreadcrumbs";
import MyPassword from "./MyPassword";
import MyInfoForm from "./MyInfoForm";
import MyPasswordForm from "./MyPasswordForm";
import styles from "./MyInfo.module.css";

export default function MyInfo() {
  const crumbs = useBreadcrumbs();
  const [verifiedPassword, setVerifiedPassword] = useState("");

  const header = <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />;

  if (!verifiedPassword) {
    return (
      <>
        {header}
        <MyPassword onVerified={setVerifiedPassword} />
      </>
    );
  }

  return (
    <>
      {header}
      <div className={`layout-split ${styles.layout}`}>
        <MyInfoForm password={verifiedPassword} />
        <MyPasswordForm setVerifiedPassword={setVerifiedPassword} />
      </div>
    </>
  );
}
