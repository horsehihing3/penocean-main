-- =====================================================================
-- V3__seed_dummy_data.sql
-- 팬오션 안전보건 DX - 로그인/화면 검증용 더미 데이터
--
-- 비밀번호:
--   - 모든 계정 평문 : "password123"  (admin 포함; 편의상 동일 해시 사용)
--   - BCrypt($2b$10$) hash:
--       $2b$10$PC8CUkM4OztXSZItxBkZ6OvYwFV66LTA4pmgNTXVEppEUDvuyJcWu
--   ※ 운영 투입 전 반드시 교체할 것.
--   [2026-04-23] 기존 해시($2a$10$N9qo8u...) 는 password123과 불일치 확인 → 새 해시로 교체
-- =====================================================================

SET NOCOUNT ON;
GO

-- =========================
-- tb_role
-- =========================
INSERT INTO tb_role (code, name, description) VALUES
    ('ADMIN',         N'시스템 관리자',  N'안전경영팀 / 포털 운영 관리자'),
    ('CONTRACTOR',    N'협력업체',       N'협력업체 사용자 (검수/고박/하역 등)'),
    ('CONTRACT_DEPT', N'계약부서',       N'협력업체와 계약을 관리하는 내부 부서');
GO

-- =========================
-- tb_department  (5개)
-- =========================
INSERT INTO tb_department (code, name, parent_id, manager_user_id) VALUES
    ('SAFETY_MGMT',  N'안전경영팀', NULL, NULL),
    ('PURCHASING',   N'구매팀',     NULL, NULL),
    ('OPERATION',    N'운영팀',     NULL, NULL),
    ('VESSEL_MGMT',  N'선박관리팀', NULL, NULL),
    ('SALES',        N'영업팀',     NULL, NULL);
GO

-- =========================
-- tb_company  (10개 협력업체)
-- =========================
INSERT INTO tb_company
    (business_number, name, ceo_name, address, phone, email, industry_code, status, contract_start_date, contract_end_date)
VALUES
    ('111-11-11111', N'대한검수',         N'김검수', N'부산광역시 중구 중앙대로 100',       '051-000-1001', 'info@daehan-inspect.co.kr',  'INSPECTION',   'ACTIVE', '2024-01-01', '2026-12-31'),
    ('222-22-22222', N'서울고박',         N'이고박', N'부산광역시 남구 용호로 200',         '051-000-1002', 'info@seoul-lashing.co.kr',   'LASHING',      'ACTIVE', '2024-03-01', '2026-12-31'),
    ('333-33-33333', N'부산하역',         N'박하역', N'부산광역시 영도구 해양로 300',        '051-000-1003', 'info@busan-steve.co.kr',     'STEVEDORING',  'ACTIVE', '2023-07-01', '2026-06-30'),
    ('444-44-44444', N'오션검정',         N'최검정', N'울산광역시 동구 방어진순환도로 400',  '052-000-1004', 'info@ocean-survey.co.kr',    'SURVEY',       'ACTIVE', '2024-01-01', '2026-12-31'),
    ('555-55-55555', N'한라선용품',       N'정용품', N'부산광역시 중구 광복로 500',          '051-000-1005', 'info@halla-supply.co.kr',    'SHIP_SUPPLY',  'ACTIVE', '2024-05-01', '2026-04-30'),
    ('666-66-66666', N'동방선박수리',     N'강수리', N'경남 거제시 장평로 600',              '055-000-1006', 'info@dongbang-repair.co.kr', 'REPAIR',       'ACTIVE', '2024-02-01', '2026-12-31'),
    ('777-77-77777', N'한빛도장',         N'조도장', N'전남 광양시 광양읍 700',              '061-000-1007', 'info@hanbit-paint.co.kr',    'PAINTING',     'ACTIVE', '2024-04-01', '2026-12-31'),
    ('888-88-88888', N'태양용접',         N'윤용접', N'울산광역시 북구 염포로 800',          '052-000-1008', 'info@taeyang-weld.co.kr',    'WELDING',      'ACTIVE', '2024-06-01', '2026-12-31'),
    ('999-99-99999', N'남해검수',         N'배검수', N'경남 통영시 무전동 900',              '055-000-1009', 'info@namhae-inspect.co.kr',  'INSPECTION',   'INACTIVE', '2023-01-01', '2025-12-31'),
    ('123-45-67890', N'퍼시픽로지스틱스', N'한물류', N'부산광역시 강서구 명지국제신도시 1',  '051-000-1010', 'info@pacific-log.co.kr',     'STEVEDORING',  'ACTIVE', '2024-08-01', '2026-12-31');
GO

-- =========================
-- tb_vessel  (8개)
-- PAN BONA, PAN TAEAN, PAN VISION ...
-- =========================
INSERT INTO tb_vessel
    (code, name, imo_number, flag, vessel_type, dwt, status, current_port)
VALUES
    ('PO-V001', N'PAN BONA',       '9876501', 'PANAMA',         'BULK',        180000.00, 'IN_SERVICE', N'부산'),
    ('PO-V002', N'PAN TAEAN',      '9876502', 'MARSHALL IS.',   'BULK',         82000.00, 'IN_SERVICE', N'광양'),
    ('PO-V003', N'PAN VISION',     '9876503', 'SINGAPORE',      'CONTAINER',    68000.00, 'IN_SERVICE', N'싱가포르'),
    ('PO-V004', N'PAN CLIPPER',    '9876504', 'LIBERIA',        'TANKER',      115000.00, 'IN_SERVICE', N'울산'),
    ('PO-V005', N'PAN HARMONY',    '9876505', 'KOREA',          'LNG',          95000.00, 'DRY_DOCK',   N'거제'),
    ('PO-V006', N'PAN PIONEER',    '9876506', 'PANAMA',         'BULK',         63000.00, 'IN_SERVICE', N'상하이'),
    ('PO-V007', N'PAN VICTORY',    '9876507', 'MARSHALL IS.',   'CAR_CARRIER',  21000.00, 'IN_SERVICE', N'요코하마'),
    ('PO-V008', N'PAN DILIGENCE',  '9876508', 'PANAMA',         'LPG',          49000.00, 'IN_SERVICE', N'로테르담');
GO

-- =========================
-- tb_port  (10개)
-- =========================
INSERT INTO tb_port (code, name, country) VALUES
    ('KRPUS', N'부산',       'KR'),
    ('KRICN', N'인천',       'KR'),
    ('KRUSN', N'울산',       'KR'),
    ('KRKAN', N'광양',       'KR'),
    ('KRPTK', N'평택',       'KR'),
    ('SGSIN', N'싱가포르',   'SG'),
    ('CNSHA', N'상하이',     'CN'),
    ('NLRTM', N'로테르담',   'NL'),
    ('USHOU', N'휴스턴',     'US'),
    ('JPYOK', N'요코하마',   'JP');
GO

-- =========================
-- tb_user  (최소 10개)
--   admin (ADMIN, 안전경영팀)
--   contractor1..5 (CONTRACTOR)  : 3 APPROVED + 2 PENDING
--   contract1..3   (CONTRACT_DEPT)
-- =========================
DECLARE @BCRYPT VARCHAR(255) = '$2b$10$PC8CUkM4OztXSZItxBkZ6OvYwFV66LTA4pmgNTXVEppEUDvuyJcWu';

DECLARE @DEPT_SAFETY  BIGINT = (SELECT id FROM tb_department WHERE code = 'SAFETY_MGMT');
DECLARE @DEPT_PURCH   BIGINT = (SELECT id FROM tb_department WHERE code = 'PURCHASING');
DECLARE @DEPT_OPER    BIGINT = (SELECT id FROM tb_department WHERE code = 'OPERATION');
DECLARE @DEPT_VESSEL  BIGINT = (SELECT id FROM tb_department WHERE code = 'VESSEL_MGMT');

DECLARE @CO_DAEHAN   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL    BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_OCEAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '444-44-44444');
DECLARE @CO_HALLA    BIGINT = (SELECT id FROM tb_company WHERE business_number = '555-55-55555');

-- 1) admin
INSERT INTO tb_user
    (username, password, name, email, phone, role_code, company_id, department_id, status, approved_at)
VALUES
    ('admin',       @BCRYPT, N'시스템관리자',  'admin@panocean.com',    '02-000-0001', 'ADMIN', NULL, @DEPT_SAFETY, 'APPROVED', SYSUTCDATETIME());

-- 2) contractors (5)
INSERT INTO tb_user
    (username, password, name, email, phone, role_code, company_id, department_id, status, approved_at)
VALUES
    ('contractor1', @BCRYPT, N'김대한',  'kim@daehan-inspect.co.kr',   '010-1111-0001', 'CONTRACTOR', @CO_DAEHAN, NULL, 'APPROVED', SYSUTCDATETIME()),
    ('contractor2', @BCRYPT, N'이서울',  'lee@seoul-lashing.co.kr',    '010-1111-0002', 'CONTRACTOR', @CO_SEOUL,  NULL, 'APPROVED', SYSUTCDATETIME()),
    ('contractor3', @BCRYPT, N'박부산',  'park@busan-steve.co.kr',     '010-1111-0003', 'CONTRACTOR', @CO_BUSAN,  NULL, 'APPROVED', SYSUTCDATETIME()),
    ('contractor4', @BCRYPT, N'최오션',  'choi@ocean-survey.co.kr',    '010-1111-0004', 'CONTRACTOR', @CO_OCEAN,  NULL, 'PENDING',  NULL),
    ('contractor5', @BCRYPT, N'정한라',  'jung@halla-supply.co.kr',    '010-1111-0005', 'CONTRACTOR', @CO_HALLA,  NULL, 'PENDING',  NULL);

-- 3) contract dept users (3)
INSERT INTO tb_user
    (username, password, name, email, phone, role_code, company_id, department_id, status, approved_at)
VALUES
    ('contract1',   @BCRYPT, N'윤구매',  'yoon@panocean.com',  '02-000-0002', 'CONTRACT_DEPT', NULL, @DEPT_PURCH,  'APPROVED', SYSUTCDATETIME()),
    ('contract2',   @BCRYPT, N'한운영',  'han@panocean.com',   '02-000-0003', 'CONTRACT_DEPT', NULL, @DEPT_OPER,   'APPROVED', SYSUTCDATETIME()),
    ('contract3',   @BCRYPT, N'서선박',  'seo@panocean.com',   '02-000-0004', 'CONTRACT_DEPT', NULL, @DEPT_VESSEL, 'APPROVED', SYSUTCDATETIME());

-- admin 본인을 approver 로 set
DECLARE @ADMIN_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
UPDATE tb_user SET approved_by = @ADMIN_ID WHERE status = 'APPROVED' AND username <> 'admin';
GO

-- =========================
-- tb_department.manager_user_id 보강
-- =========================
UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'admin')
 WHERE code = 'SAFETY_MGMT';

UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'contract1')
 WHERE code = 'PURCHASING';

UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'contract2')
 WHERE code = 'OPERATION';

UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'contract3')
 WHERE code = 'VESSEL_MGMT';
GO

-- =========================
-- tb_user_department  (다대다 샘플)
--   contract1 → 구매팀 + 영업팀
--   contract2 → 운영팀
--   contract3 → 선박관리팀 + 운영팀
-- =========================
INSERT INTO tb_user_department (user_id, department_id)
SELECT u.id, d.id FROM tb_user u, tb_department d
WHERE (u.username = 'contract1' AND d.code IN ('PURCHASING','SALES'))
   OR (u.username = 'contract2' AND d.code IN ('OPERATION'))
   OR (u.username = 'contract3' AND d.code IN ('VESSEL_MGMT','OPERATION'));
GO

-- =========================
-- tb_user_industry  (다대다 샘플)
--   contractor1 (대한검수) → INSPECTION + SURVEY
--   contractor2 (서울고박) → LASHING
--   contractor3 (부산하역) → STEVEDORING + LASHING
--   contractor4 (오션검정) → SURVEY
--   contractor5 (한라선용품) → SHIP_SUPPLY
-- =========================
INSERT INTO tb_user_industry (user_id, industry_code)
SELECT u.id, v.ic FROM tb_user u
CROSS APPLY (VALUES
    ('contractor1','INSPECTION'),
    ('contractor1','SURVEY'),
    ('contractor2','LASHING'),
    ('contractor3','STEVEDORING'),
    ('contractor3','LASHING'),
    ('contractor4','SURVEY'),
    ('contractor5','SHIP_SUPPLY')
) v(un, ic)
WHERE u.username = v.un;
GO

-- =========================
-- tb_notification (5건)
-- =========================
DECLARE @U_ADMIN   BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @U_C1      BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor1');
DECLARE @U_C4      BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor4');
DECLARE @U_CT1     BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');

INSERT INTO tb_notification (recipient_user_id, channel, subject, body, status, sent_at) VALUES
    (@U_ADMIN, 'SYSTEM', N'신규 가입 승인 요청',  N'contractor4 님이 가입 승인을 요청했습니다.', 'SENT',    SYSUTCDATETIME()),
    (@U_ADMIN, 'SYSTEM', N'신규 가입 승인 요청',  N'contractor5 님이 가입 승인을 요청했습니다.', 'SENT',    SYSUTCDATETIME()),
    (@U_C1,    'EMAIL',  N'[팬오션] 가입 승인',    N'귀하의 포털 가입이 승인되었습니다.',        'SENT',    SYSUTCDATETIME()),
    (@U_C4,    'EMAIL',  N'[팬오션] 가입 접수',    N'가입 신청이 접수되어 관리자 승인 대기중입니다.', 'PENDING', NULL),
    (@U_CT1,   'KAKAO',  N'[팬오션] 신규 협력업체', N'신규 협력업체(한라선용품) 등록이 완료되었습니다.', 'SENT', SYSUTCDATETIME());
GO
