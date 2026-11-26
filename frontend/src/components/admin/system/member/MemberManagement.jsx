import { useEffect, useId, useState } from "react";
import usePermission from "../../../../hooks/usePermission.js";
import useBreadcrumbs from "../../../../hooks/useBreadcrumbs.js";
import {
  getAssignableRoles,
  getMembers,
} from "../../../../api/admin/system/member/memberApi.js";
import PageHeader from "../../../common/ui/PageHeader.jsx";
import StatusBox from "../../../common/ui/StatusBox.jsx";
import Field from "../../../common/ui/Field.jsx";
import Button from "../../../common/ui/Button.jsx";
import Badge from "../../../common/ui/Badge.jsx";
import Table from "../../../common/ui/Table.jsx";
import Pagination from "../../../common/ui/Pagination.jsx";
import { useToast } from "../../../common/ui/feedbackContext.js";
import { icons } from "../../../common/input/icons.js";
import MemberDetail from "./MemberDetail.jsx";
import MemberCreateModal from "./MemberCreateModal.jsx";
import styles from "./MemberManagement.module.css";
import { displayName } from "../../../../utils/displayName.js";

export default function MemberManagement() {
  const { can, status } = usePermission();
  const crumbs = useBreadcrumbs();

  // idle: 비로그인 → 표시 없음
  let content = null;
  if (status === "loading") {
    content = <StatusBox type="loading" title="권한 확인 중..." />;
  } else if (status === "failed") {
    content = (
      <StatusBox
        type="error"
        title="권한 정보를 불러오지 못했습니다."
        detail="새로고침 후 다시 시도해 주세요."
      />
    );
  } else if (status === "loaded") {
    if (can("MEMBER_READ_LIST")) {
      content = <MemberManagementContent />;
    } else {
      content = <StatusBox type="denied" />;
    }
  }

  return (
    <>
      <PageHeader crumbs={crumbs} title={crumbs.at(-1)?.title} />
      {content}
    </>
  );
}

function MemberManagementContent() {
  const { can } = usePermission();
  const toast = useToast();
  const roleFilterId = useId();
  const keywordId = useId();
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

  const renderStatus = (member) => {
    if (member.loginBlockDate) {
      return <Badge tone="danger">잠김</Badge>;
    }
    return <Badge tone="success">정상</Badge>;
  };

  // 내가 지정할 수 있는 역할 목록 (자기보다 아래 역할만, 최고 관리자 제외)
  // 검색 필터 · 등록 모달 · 역할 변경 선택지로 쓴다.
  useEffect(() => {
    const controller = new AbortController();
    getAssignableRoles({ signal: controller.signal })
      .then((roleList) => {
        setRoles(roleList);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          toast.error(error.message);
        }
      });
    return () => controller.abort();
  }, [toast]);

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
          toast.error(error.message);
        }
      });

    return () => controller.abort();
  }, [search, toast]);

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

  // 회원 목록 표 칸
  const columns = [
    { key: "id", title: "아이디", mono: true },
    {
      key: "name",
      title: "이름",
      render: (member) => displayName(member.name, member.nameSuffix),
    },
    { key: "roleName", title: "역할", width: "16%" },
    { key: "createDate", title: "등록일", width: "22%" },
    {
      key: "status",
      title: "상태",
      width: "80px",
      align: "center",
      render: renderStatus,
    },
  ];

  // 오른쪽 상세: 권한 없음 · 고른 회원 없음(목록이 비었을 때)도 표시
  let detail = <StatusBox type="empty" title="회원을 고르세요." />;
  if (!can("MEMBER_READ_DETAIL")) {
    detail = (
      <StatusBox type="denied" title="회원 상세를 볼 권한이 없습니다." />
    );
  } else if (selectedMemberId) {
    detail = (
      <MemberDetail
        key={selectedMemberId}
        memberId={selectedMemberId}
        roles={roles}
        onChanged={reloadList}
      />
    );
  }

  return (
    <>
      <div className="form-stack">
        <div className="toolbar">
          <div className={`form-row ${styles.filters}`}>
            {roles.length > 0 && (
              <Field label="역할" htmlFor={roleFilterId}>
                <select
                  id={roleFilterId}
                  className="form-control"
                  value={selectedRoleFilter}
                  onChange={(event) =>
                    setSelectedRoleFilter(event.target.value)
                  }
                >
                  <option value="">전체 역할</option>
                  {roles.map((role) => (
                    <option key={role.roleId} value={role.roleId}>
                      {role.roleDisplayName}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="검색어" htmlFor={keywordId}>
              <input
                id={keywordId}
                type="search"
                className="form-control"
                placeholder="아이디 또는 이름"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                    handleSearch();
                  }
                }}
              />
            </Field>

            <div className="btn-group">
              <Button onClick={handleSearch}>검색</Button>
              <Button onClick={handleReset}>초기화</Button>
            </div>
          </div>

          {can("MEMBER_CREATE") && roles.length > 0 && (
            <Button
              variant="primary"
              icon={icons.add}
              onClick={() => setIsCreateOpen(true)}
            >
              회원 등록
            </Button>
          )}
        </div>

        {/* 목록 표 | 회원 상세 */}
        <div className="layout-split">
          <div>
            <Table
              ariaLabel="회원 목록"
              size="sm"
              columns={columns}
              rows={members}
              selectedKey={selectedMemberId}
              onRowClick={(row) => setSelectedMemberId(row.id)}
              emptyText="조회된 회원이 없습니다."
            />
            {pagination && (
              <div className="table-footer">
                <Pagination
                  page={pagination.pageNo}
                  totalPages={pagination.pageCount}
                  onChange={(pageNo) =>
                    setSearch((prev) => ({ ...prev, pageNo }))
                  }
                />
              </div>
            )}
          </div>
          {detail}
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
