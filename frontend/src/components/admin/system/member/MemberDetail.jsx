import { useEffect, useState } from "react";
import { getMember } from "../../../../api/admin/system/member/memberApi.js";
import styles from "./MemberDetail.module.css";

const orDash = (value) => {
  if (value) {
    return value;
  }
  return "-";
};

const DETAIL_FIELDS = [
  { label: "아이디", getValue: (member) => member.id },
  { label: "이름", getValue: (member) => member.name },
  { label: "역할", getValue: (member) => member.roleName },
  { label: "GitHub", getValue: (member) => orDash(member.githubUrl) },
  {
    label: "등록일",
    getValue: (member) => member.createDate,
  },
  {
    label: "수정일",
    getValue: (member) => orDash(member.modifyDate),
  },
  {
    label: "비밀번호 변경일",
    getValue: (member) => orDash(member.pwdChangeDate),
  },
  {
    label: "로그인 실패 횟수",
    getValue: (member) => member.loginFailCount,
  },
  { label: "잠금 시각", getValue: (member) => orDash(member.loginBlockDate) },
];

export default function MemberDetail({ memberId }) {
  const [member, setMember] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    getMember(memberId, { signal: controller.signal })
      .then((result) => {
        setMember(result);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      });

    return () => controller.abort();
  }, [memberId]);

  if (member === null) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>회원 상세</h3>
      <dl className={styles.detailList}>
        {DETAIL_FIELDS.map((field) => (
          <div key={field.label}>
            <dt>{field.label}</dt>
            <dd>{field.getValue(member)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
