import { useEffect, useState } from "react";
import usePermission from "../../../../hooks/usePermission.js";
import PageContainer from "../../../common/PageContainer.jsx";
import { getMembers } from "../../../../api/admin/system/member/memberApi.js";
import styles from "./MemberManagement.module.css";
import { Grid } from "../../../common/Grid.jsx";
import { Paginator } from "../../../common/Paginator.jsx";
import MemberDetail from "./MemberDetail.jsx";

export default function MemberManagement() {
  const { can } = usePermission();
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState({
    pageNo: 0,
    listSize: 10,
    keyword: "",
    roleId: "",
  });
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const formatStatus = (member) => {
    if (member.loginBlockDate) {
      return "잠김";
    }
    return "";
  };

  const canReadList = can("MEMBER_READ_LIST");

  useEffect(() => {
    if (!canReadList) {
      return;
    }

    const controller = new AbortController();

    getMembers(search, { signal: controller.signal })
      .then(({ body, paginate }) => {
        setMembers(body);
        setPagination(paginate);
        setSelectedMemberId((prevId) => {
          if (body.some((member) => member.id === prevId)) {
            return prevId;
          }
          if (body.length > 0) {
            return body[0].id;
          }
          return null;
        });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      });

    return () => controller.abort();
  }, [canReadList, search]);

  // 멤버 그리드 데이터 구성
  const header = [
    { id: "id", title: "아이디" },
    { id: "name", title: "이름" },
    { id: "roleName", title: "역할" },
    { id: "createDate", title: "등록일" },
    { id: "loginBlockDate", title: "상태" },
  ];

  const content = members.map((member) => [
    { id: member.id, keyName: "id", value: member.id },
    { id: member.id, keyName: "name", value: member.name },
    { id: member.id, keyName: "roleName", value: member.roleName },
    { id: member.id, keyName: "createDate", value: member.createDate },
    { id: member.id, keyName: "loginBlockDate", value: formatStatus(member) },
  ]);

  const selectedRowIndex = members.findIndex(
    (member) => member.id === selectedMemberId,
  );
  let activeRows = [];
  if (selectedRowIndex >= 0) {
    activeRows = [selectedRowIndex];
  }

  return (
    <PageContainer>
      <div className={styles.layout}>
        <div className={styles.listArea}>
          {members.length === 0 && <p>조회된 회원이 없습니다.</p>}
          <Grid
            className={styles.grid}
            title=""
            header={header}
            content={content}
            columnStyle="1.5fr 1fr 1fr 1.5fr 80px"
            clickableColumn={{
              0: (value) => {
                setSelectedMemberId(value);
              },
            }}
            activeRows={activeRows}
          />
          {pagination && (
            <Paginator
              id="member"
              start={pagination.groupStartPageNo}
              countPerPageGroup={pagination.pageCountInGroup}
              activePage={pagination.pageNo}
              totalPageCount={pagination.pageCount}
              setActivePage={(pageNo) => setSearch({ ...search, pageNo })}
            />
          )}
        </div>
        {selectedMemberId && can("MEMBER_READ_DETAIL") && (
          <MemberDetail key={selectedMemberId} memberId={selectedMemberId} />
        )}
      </div>
    </PageContainer>
  );
}
