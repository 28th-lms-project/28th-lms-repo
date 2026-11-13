import { useEffect, useState } from "react";
import usePermission from "../../../../hooks/usePermission.js";
import PageContainer from "../../../common/PageContainer.jsx";
import { getMembers } from "../../../../api/admin/system/member/memberApi.js";
import { getRoles } from "../../../../api/admin/system/role/roleApi.js";
import styles from "./MemberManagement.module.css";
import { Grid } from "../../../common/Grid.jsx";
import { Paginator } from "../../../common/Paginator.jsx";
import MemberDetail from "./MemberDetail.jsx";
import MemberCreateModal from "./MemberCreateModal.jsx";

export default function MemberManagement() {
  const { can, status } = usePermission();

  let content = null;
  if (status === "loading") {
    content = <p className={styles.notice}>권한 확인 중...</p>;
  } else if (status === "failed") {
    content = (
      <p className={styles.notice}>
        권한 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.
      </p>
    );
  } else if (status === "loaded") {
    if (can("MEMBER_READ_LIST")) {
      content = <MemberManagementContent />;
    } else {
      content = <p className={styles.notice}>권한이 없습니다.</p>;
    }
  }

  return <PageContainer>{content}</PageContainer>;
}

function MemberManagementContent() {
  const { can } = usePermission();
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [roles, setRoles] = useState([]);

  // 검색 조건
  const [search, setSearch] = useState({
    pageNo: 0,
    listSize: 10,
    keyword: "",
    roleId: "",
  });

  // 검색 폼 입력값 (검색 버튼 클릭 전 임시 상태)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canReadRoles = can("ROLE_READ");

  const formatStatus = (member) => {
    if (member.loginBlockDate) {
      return "잠김";
    }
    return "정상";
  };

  // 시스템 역할 목록 조회 (ROLE_READ 권한이 있을 때만 호출)
  useEffect(() => {
    if (!canReadRoles) {
      return;
    }

    const controller = new AbortController();
    getRoles({ signal: controller.signal })
      .then((data) => {
        if (data && data.roleList) {
          setRoles(data.roleList);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          alert(error.message);
        }
      });
    return () => controller.abort();
  }, [canReadRoles]);

  // 회원 목록 조회 (MEMBER_READ_LIST 권한이 확인된 후 마운트됨)
  useEffect(() => {
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
  }, [search]);

  // 검색 실행
  const handleSearch = () => {
    setSearch((prev) => ({
      ...prev,
      pageNo: 0,
      keyword: keywordInput.trim(),
      roleId: selectedRoleFilter,
    }));
  };

  // 검색 초기화
  const handleReset = () => {
    setSelectedRoleFilter("");
    setKeywordInput("");
    setSearch({
      pageNo: 0,
      listSize: 10,
      keyword: "",
      roleId: "",
    });
  };

  const reloadList = () => setSearch((prev) => ({ ...prev }));

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
    <>
      <div className={styles.container}>
        {/* 상단 툴바 (검색 / 필터 / 등록 버튼) */}
        <div className={styles.toolbar}>
          <div className={styles.searchGroup}>
            {canReadRoles && (
              <select
                className={styles.select}
                value={selectedRoleFilter}
                onChange={(event) => setSelectedRoleFilter(event.target.value)}
              >
                <option value="">전체 역할</option>
                {roles.map((role) => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleDisplayName}
                  </option>
                ))}
              </select>
            )}

            <input
              className={styles.searchInput}
              type="text"
              placeholder="아이디 또는 이름 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  handleSearch();
                }
              }}
            />

            <button
              type="button"
              className={styles.btnSearch}
              onClick={handleSearch}
            >
              검색
            </button>
            <button
              type="button"
              className={styles.btnReset}
              onClick={handleReset}
            >
              초기화
            </button>
          </div>

          {can("MEMBER_CREATE") && canReadRoles && (
            <button
              type="button"
              className={styles.btnCreate}
              onClick={() => setIsCreateOpen(true)}
            >
              + 회원 등록
            </button>
          )}
        </div>

        {/* 본문 (목록 그리드 + 상세 패널) */}
        <div className={styles.layout}>
          <div className={styles.listArea}>
            {members.length === 0 && (
              <div className={styles.emptyNotice}>조회된 회원이 없습니다.</div>
            )}

            {members.length > 0 && (
              <Grid
                className={styles.grid}
                title=""
                header={header}
                content={content}
                columnStyle="1.5fr 1fr 1fr 1.5fr 90px"
                clickableColumn={{
                  0: (value) => {
                    setSelectedMemberId(value);
                  },
                }}
                activeRows={activeRows}
              />
            )}

            {pagination && (
              <div className={styles.paginationWrap}>
                <Paginator
                  id="member"
                  start={pagination.groupStartPageNo}
                  countPerPageGroup={pagination.pageCountInGroup}
                  activePage={pagination.pageNo}
                  totalPageCount={pagination.pageCount}
                  setActivePage={(pageNo) =>
                    setSearch((prev) => ({ ...prev, pageNo }))
                  }
                />
              </div>
            )}
          </div>

          {selectedMemberId && can("MEMBER_READ_DETAIL") && (
            <MemberDetail
              key={selectedMemberId}
              memberId={selectedMemberId}
              roles={roles}
              onChanged={reloadList}
            />
          )}
        </div>
      </div>

      {/* 신규 회원 등록 모달 */}
      {isCreateOpen && (
        <MemberCreateModal
          roles={roles}
          onClose={() => setIsCreateOpen(false)}
          onCompleted={(newId) => {
            setIsCreateOpen(false);
            if (newId) {
              setSelectedMemberId(newId);
            }
            reloadList();
          }}
        />
      )}
    </>
  );
}
