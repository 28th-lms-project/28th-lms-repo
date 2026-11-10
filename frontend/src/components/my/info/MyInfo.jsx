import { useState } from "react";
import PageContainer from "../../common/PageContainer";
import MyPassword from "./MyPassword";
import MyInfoForm from "./MyInfoForm";
import MyPasswordForm from "./MyPasswordForm";
import styles from "./MyInfo.module.css";

export default function MyInfo() {
  const [verifiedPassword, setVerifiedPassword] = useState("");

  if (!verifiedPassword) {
    return (
      <PageContainer>
        <MyPassword onVerified={setVerifiedPassword} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className={styles.layout}>
        <MyInfoForm password={verifiedPassword} />
        <MyPasswordForm setVerifiedPassword={setVerifiedPassword} />
      </div>
    </PageContainer>
  );
}
