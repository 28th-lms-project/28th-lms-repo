-- ACCESS 모듈 정리(feature/access-cleanup)용 DB 작업
-- 항목 번호는 remaining-issues.md 기준. 실행 전 반드시 백업 · 데이터 확인.
-- 실행: DB 담당자 (Claude Code는 실행하지 않음)


-- ───────── 2. ROLE_ACTION PK를 팀 규칙으로 ─────────
-- 백엔드 배포 "전에" 실행하세요. 시퀀스가 없으면 권한 저장(/access-role/save)이 실패합니다.

-- 2-1. ROLE_ACTION_ID 시퀀스 ('RA-YYYYMMDD-000001')
--      이미 있으면(ORA-00955) 건너뛰세요.
CREATE SEQUENCE SEQ_ROLE_ACTION_PK
    START WITH 1
    INCREMENT BY 1
    NOCACHE;

-- 2-2. (선택) 같은 역할에 같은 권한이 두 번 들어가지 않도록 UNIQUE 제약 (MENU_ROLE과 같은 방식)
--      먼저 중복이 없는지 확인 (0건이어야 함. 2026-11-12 기준 0건)
SELECT ROLE_ID, ACTION_ID, COUNT(*)
  FROM ROLE_ACTION
 GROUP BY ROLE_ID, ACTION_ID
HAVING COUNT(*) > 1;

ALTER TABLE ROLE_ACTION ADD CONSTRAINT UK_ROLE_ACTION UNIQUE (ROLE_ID, ACTION_ID);

-- 기존 GUID 형식 ROLE_ACTION_ID 행은 그대로 둬도 됩니다.
-- 권한 저장은 그 역할의 행을 모두 지우고 다시 넣으므로, 역할별로 한 번 저장하면 새 형식으로 바뀝니다.
