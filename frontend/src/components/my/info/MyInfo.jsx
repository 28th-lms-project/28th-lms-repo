import { useState } from "react";
import PageContainer from "../../common/PageContainer";
import MyPassword from "./MyPassword";
import MyInfoForm from "./MyInfoForm";

export default function MyInfo() {
  const [verifiedPassword, setVerifiedPassword] = useState(false);

  if (!verifiedPassword) {
    return (
      <PageContainer>
        <MyPassword onVerified={setVerifiedPassword} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MyInfoForm password={verifiedPassword} />
    </PageContainer>
  );
}
