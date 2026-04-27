-- =====================================================================
-- V6__phase3_seed_dummy.sql
-- 팬오션 안전보건 DX - Phase 3 화면 검증용 더미 데이터
--   - tb_access_request (6건, 모든 status 조합)
--   - tb_access_worker  (각 request 3~5명)
--   - tb_access_attachment (각 request RISK_ASSESSMENT + WORK_PLAN)
--   - tb_visit_permit   (APPROVED 건 1건)
--   - tb_access_review_log (상태 변경 로그)
--   - tb_daily_safety_log (5건; PAN BONA 3 / PAN TAEAN 2)
-- =====================================================================

SET NOCOUNT ON;
GO

-- =========================
-- 공통 FK lookup
-- =========================
DECLARE @U_ADMIN   BIGINT = (SELECT id FROM tb_user   WHERE username = 'admin');
DECLARE @U_C1      BIGINT = (SELECT id FROM tb_user   WHERE username = 'contractor1');
DECLARE @U_C2      BIGINT = (SELECT id FROM tb_user   WHERE username = 'contractor2');
DECLARE @U_C3      BIGINT = (SELECT id FROM tb_user   WHERE username = 'contractor3');
DECLARE @U_CT1     BIGINT = (SELECT id FROM tb_user   WHERE username = 'contract1');
DECLARE @U_CT2     BIGINT = (SELECT id FROM tb_user   WHERE username = 'contract2');
DECLARE @U_CT3     BIGINT = (SELECT id FROM tb_user   WHERE username = 'contract3');

DECLARE @CO_DAEHAN BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL  BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN  BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');

DECLARE @V_BONA    BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');  -- PAN BONA
DECLARE @V_TAEAN   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V002');  -- PAN TAEAN
DECLARE @V_VISION  BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V003');  -- PAN VISION

DECLARE @P_PUS     BIGINT = (SELECT id FROM tb_port    WHERE code = 'KRPUS');
DECLARE @P_KAN     BIGINT = (SELECT id FROM tb_port    WHERE code = 'KRKAN');
DECLARE @P_USN     BIGINT = (SELECT id FROM tb_port    WHERE code = 'KRUSN');

-- =========================
-- tb_access_request (6건)
-- DRAFT 1 / SUBMITTED 2 / IN_REVIEW 1 / IMPROVEMENT_REQUESTED 1 / APPROVED 1
-- =========================
INSERT INTO tb_access_request
    (request_no, company_id, vessel_id, port_id, work_type, work_description,
     planned_start_date, planned_end_date, worker_count,
     status, submitted_by, submitted_at, reviewed_by, reviewed_at, improvement_request_reason,
     created_at)
VALUES
    -- 1) DRAFT
    ('AR-20260401-0001', @CO_DAEHAN, @V_BONA,   @P_PUS,
     N'화물검수', N'부산항 정박 중 화물 검수 작업 (contractor1 작성 중)',
     '2026-04-20', '2026-04-22', 3,
     'DRAFT', @U_C1, NULL, NULL, NULL, NULL,
     DATEADD(day, -2,  SYSUTCDATETIME())),

    -- 2) SUBMITTED
    ('AR-20260405-0002', @CO_SEOUL,  @V_TAEAN,  @P_KAN,
     N'고박작업', N'광양항 컨테이너 고박 작업',
     '2026-04-22', '2026-04-23', 5,
     'SUBMITTED', @U_C2, DATEADD(day, -5, SYSUTCDATETIME()), NULL, NULL, NULL,
     DATEADD(day, -6,  SYSUTCDATETIME())),

    -- 3) SUBMITTED
    ('AR-20260406-0003', @CO_BUSAN,  @V_VISION, @P_PUS,
     N'하역작업', N'부산신항 하역 작업 - 컨테이너 200박스',
     '2026-04-24', '2026-04-26', 8,
     'SUBMITTED', @U_C3, DATEADD(day, -4, SYSUTCDATETIME()), NULL, NULL, NULL,
     DATEADD(day, -5,  SYSUTCDATETIME())),

    -- 4) IN_REVIEW
    ('AR-20260408-0004', @CO_DAEHAN, @V_TAEAN,  @P_USN,
     N'선박도장', N'울산항 선체 부분도장 (방청작업 포함)',
     '2026-04-25', '2026-04-30', 6,
     'IN_REVIEW', @U_C1, DATEADD(day, -7, SYSUTCDATETIME()), @U_CT2, DATEADD(day, -2, SYSUTCDATETIME()), NULL,
     DATEADD(day, -8,  SYSUTCDATETIME())),

    -- 5) IMPROVEMENT_REQUESTED
    ('AR-20260410-0005', @CO_SEOUL,  @V_BONA,   @P_PUS,
     N'고박점검', N'출항 전 고박 상태 점검 및 재고박',
     '2026-04-21', '2026-04-21', 4,
     'IMPROVEMENT_REQUESTED', @U_C2, DATEADD(day, -10, SYSUTCDATETIME()), @U_CT2, DATEADD(day, -3, SYSUTCDATETIME()),
     N'위험성평가서 내 추락 위험 평가 누락. 작업계획서에 안전모 미기재. 보완 후 재제출 바랍니다.',
     DATEADD(day, -11, SYSUTCDATETIME())),

    -- 6) APPROVED
    ('AR-20260412-0006', @CO_BUSAN,  @V_VISION, @P_PUS,
     N'화물검수', N'부산항 벌크화물 검수 (완료된 건)',
     '2026-04-18', '2026-04-20', 3,
     'APPROVED', @U_C3, DATEADD(day, -9, SYSUTCDATETIME()), @U_CT3, DATEADD(day, -1, SYSUTCDATETIME()), NULL,
     DATEADD(day, -10, SYSUTCDATETIME()));
GO

-- =========================
-- tb_access_worker : 각 request 당 3~5명
-- =========================
DECLARE @AR1 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260401-0001');
DECLARE @AR2 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260405-0002');
DECLARE @AR3 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260406-0003');
DECLARE @AR4 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260408-0004');
DECLARE @AR5 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260410-0005');
DECLARE @AR6 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260412-0006');

-- AR1 (DRAFT, 3명: 2 완료 / 1 미완료)
INSERT INTO tb_access_worker
    (access_request_id, worker_name, worker_birth, worker_phone, worker_role,
     safety_edu_completed, safety_edu_completed_at, safety_edu_certificate_url)
VALUES
    (@AR1, N'김현장',  '1980-03-15', '010-2000-0001', N'현장팀장',
     1, DATEADD(day, -20, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0001.pdf'),
    (@AR1, N'박작업',  '1985-07-22', '010-2000-0002', N'작업자',
     1, DATEADD(day, -18, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0002.pdf'),
    (@AR1, N'이신입',  '1995-11-01', '010-2000-0003', N'작업자',
     0, NULL, NULL);

-- AR2 (SUBMITTED, 5명)
INSERT INTO tb_access_worker
    (access_request_id, worker_name, worker_birth, worker_phone, worker_role,
     safety_edu_completed, safety_edu_completed_at, safety_edu_certificate_url)
VALUES
    (@AR2, N'이고박',  '1978-05-10', '010-2000-0101', N'현장팀장',
     1, DATEADD(day, -30, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0101.pdf'),
    (@AR2, N'서고박',  '1982-02-18', '010-2000-0102', N'작업자',
     1, DATEADD(day, -25, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0102.pdf'),
    (@AR2, N'정고박',  '1990-09-03', '010-2000-0103', N'작업자',
     1, DATEADD(day, -22, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0103.pdf'),
    (@AR2, N'한고박',  '1993-12-25', '010-2000-0104', N'작업자',
     0, NULL, NULL),
    (@AR2, N'노고박',  '1996-04-07', '010-2000-0105', N'작업자',
     1, DATEADD(day, -10, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0105.pdf');

-- AR3 (SUBMITTED, 4명)
INSERT INTO tb_access_worker
    (access_request_id, worker_name, worker_birth, worker_phone, worker_role,
     safety_edu_completed, safety_edu_completed_at, safety_edu_certificate_url)
VALUES
    (@AR3, N'박하역',  '1975-08-12', '010-2000-0201', N'현장팀장',
     1, DATEADD(day, -40, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0201.pdf'),
    (@AR3, N'조하역',  '1988-06-14', '010-2000-0202', N'작업자',
     1, DATEADD(day, -15, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0202.pdf'),
    (@AR3, N'최하역',  '1992-01-20', '010-2000-0203', N'작업자',
     0, NULL, NULL),
    (@AR3, N'윤하역',  '1991-10-30', '010-2000-0204', N'작업자',
     1, DATEADD(day, -12, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0204.pdf');

-- AR4 (IN_REVIEW, 5명 모두 완료)
INSERT INTO tb_access_worker
    (access_request_id, worker_name, worker_birth, worker_phone, worker_role,
     safety_edu_completed, safety_edu_completed_at, safety_edu_certificate_url)
VALUES
    (@AR4, N'김도장',  '1979-02-02', '010-2000-0301', N'현장팀장',
     1, DATEADD(day, -29, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0301.pdf'),
    (@AR4, N'송도장',  '1983-04-04', '010-2000-0302', N'작업자',
     1, DATEADD(day, -28, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0302.pdf'),
    (@AR4, N'전도장',  '1987-06-06', '010-2000-0303', N'작업자',
     1, DATEADD(day, -27, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0303.pdf'),
    (@AR4, N'강도장',  '1990-08-08', '010-2000-0304', N'작업자',
     1, DATEADD(day, -26, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0304.pdf'),
    (@AR4, N'남도장',  '1994-10-10', '010-2000-0305', N'작업자',
     1, DATEADD(day, -24, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0305.pdf');

-- AR5 (IMPROVEMENT_REQUESTED, 4명, 2 완료 / 2 미완료)
INSERT INTO tb_access_worker
    (access_request_id, worker_name, worker_birth, worker_phone, worker_role,
     safety_edu_completed, safety_edu_completed_at, safety_edu_certificate_url)
VALUES
    (@AR5, N'오고박',  '1981-11-11', '010-2000-0401', N'현장팀장',
     1, DATEADD(day, -35, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0401.pdf'),
    (@AR5, N'신고박',  '1986-03-03', '010-2000-0402', N'작업자',
     1, DATEADD(day, -17, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0402.pdf'),
    (@AR5, N'문고박',  '1992-05-05', '010-2000-0403', N'작업자',
     0, NULL, NULL),
    (@AR5, N'황고박',  '1997-07-07', '010-2000-0404', N'작업자',
     0, NULL, NULL);

-- AR6 (APPROVED, 3명 모두 완료)
INSERT INTO tb_access_worker
    (access_request_id, worker_name, worker_birth, worker_phone, worker_role,
     safety_edu_completed, safety_edu_completed_at, safety_edu_certificate_url)
VALUES
    (@AR6, N'류검수',  '1976-12-01', '010-2000-0501', N'현장팀장',
     1, DATEADD(day, -45, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0501.pdf'),
    (@AR6, N'배검수',  '1984-02-14', '010-2000-0502', N'작업자',
     1, DATEADD(day, -44, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0502.pdf'),
    (@AR6, N'안검수',  '1989-09-19', '010-2000-0503', N'작업자',
     1, DATEADD(day, -40, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0503.pdf');
GO

-- =========================
-- tb_access_attachment : 각 request 당 RISK_ASSESSMENT + WORK_PLAN
-- =========================
DECLARE @U_C1  BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor1');
DECLARE @U_C2  BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor2');
DECLARE @U_C3  BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor3');

INSERT INTO tb_access_attachment
    (access_request_id, attachment_type, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at)
SELECT ar.id, v.atype, v.fname, v.fpath, v.fsize, v.mime, v.uid, DATEADD(day, v.offset_day, SYSUTCDATETIME())
FROM tb_access_request ar
CROSS APPLY (VALUES
    ('AR-20260401-0001', 'RISK_ASSESSMENT', N'위험성평가서_AR0001.pdf', '/uploads/dummy/ar-0001/risk.pdf',      245678, 'application/pdf', @U_C1, -2),
    ('AR-20260401-0001', 'WORK_PLAN',       N'작업계획서_AR0001.pdf',   '/uploads/dummy/ar-0001/workplan.pdf', 189234, 'application/pdf', @U_C1, -2),
    ('AR-20260405-0002', 'RISK_ASSESSMENT', N'위험성평가서_AR0002.pdf', '/uploads/dummy/ar-0002/risk.pdf',      301122, 'application/pdf', @U_C2, -5),
    ('AR-20260405-0002', 'WORK_PLAN',       N'작업계획서_AR0002.pdf',   '/uploads/dummy/ar-0002/workplan.pdf', 210998, 'application/pdf', @U_C2, -5),
    ('AR-20260406-0003', 'RISK_ASSESSMENT', N'위험성평가서_AR0003.pdf', '/uploads/dummy/ar-0003/risk.pdf',      278500, 'application/pdf', @U_C3, -4),
    ('AR-20260406-0003', 'WORK_PLAN',       N'작업계획서_AR0003.pdf',   '/uploads/dummy/ar-0003/workplan.pdf', 198776, 'application/pdf', @U_C3, -4),
    ('AR-20260408-0004', 'RISK_ASSESSMENT', N'위험성평가서_AR0004.pdf', '/uploads/dummy/ar-0004/risk.pdf',      332110, 'application/pdf', @U_C1, -7),
    ('AR-20260408-0004', 'WORK_PLAN',       N'작업계획서_AR0004.pdf',   '/uploads/dummy/ar-0004/workplan.pdf', 220330, 'application/pdf', @U_C1, -7),
    ('AR-20260410-0005', 'RISK_ASSESSMENT', N'위험성평가서_AR0005.pdf', '/uploads/dummy/ar-0005/risk.pdf',      256660, 'application/pdf', @U_C2, -10),
    ('AR-20260410-0005', 'WORK_PLAN',       N'작업계획서_AR0005.pdf',   '/uploads/dummy/ar-0005/workplan.pdf', 174882, 'application/pdf', @U_C2, -10),
    ('AR-20260412-0006', 'RISK_ASSESSMENT', N'위험성평가서_AR0006.pdf', '/uploads/dummy/ar-0006/risk.pdf',      289900, 'application/pdf', @U_C3, -9),
    ('AR-20260412-0006', 'WORK_PLAN',       N'작업계획서_AR0006.pdf',   '/uploads/dummy/ar-0006/workplan.pdf', 205110, 'application/pdf', @U_C3, -9)
) v(req_no, atype, fname, fpath, fsize, mime, uid, offset_day)
WHERE ar.request_no = v.req_no;
GO

-- =========================
-- tb_visit_permit : APPROVED 된 AR6 에 대해 1건
-- =========================
DECLARE @AR6 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260412-0006');
DECLARE @V_VISION BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V003');
DECLARE @CO_BUSAN BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @U_CT3    BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract3');

INSERT INTO tb_visit_permit
    (permit_no, access_request_id, vessel_id, company_id,
     valid_from, valid_to, qr_code_url, issued_by, issued_at, revoked)
VALUES
    ('VP-20260101-0001', @AR6, @V_VISION, @CO_BUSAN,
     '2026-04-18 00:00:00', '2026-04-20 23:59:59',
     '/uploads/dummy/qr/vp-20260101-0001.png',
     @U_CT3, DATEADD(day, -1, SYSUTCDATETIME()), 0);
GO

-- =========================
-- tb_access_review_log : 상태 변경 로그
-- =========================
DECLARE @AR4 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260408-0004');
DECLARE @AR5 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260410-0005');
DECLARE @AR6 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260412-0006');
DECLARE @U_CT2 BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');
DECLARE @U_CT3 BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');

INSERT INTO tb_access_review_log
    (access_request_id, action, comment, actor_user_id, acted_at)
VALUES
    -- AR4: IN_REVIEW
    (@AR4, 'REVIEW_START', N'서류 검토 시작',                                   @U_CT2, DATEADD(day, -3, SYSUTCDATETIME())),
    -- AR5: IMPROVEMENT_REQUESTED
    (@AR5, 'REVIEW_START',        N'서류 검토 시작',                             @U_CT2, DATEADD(day, -6, SYSUTCDATETIME())),
    (@AR5, 'IMPROVEMENT_REQUEST', N'위험성평가 누락, 작업계획서 안전모 미기재',   @U_CT2, DATEADD(day, -3, SYSUTCDATETIME())),
    -- AR6: APPROVED
    (@AR6, 'REVIEW_START', N'서류 검토 시작',                                   @U_CT3, DATEADD(day, -5, SYSUTCDATETIME())),
    (@AR6, 'APPROVE',      N'서류 검토 완료. 위험성평가/작업계획서 이상 없음.', @U_CT3, DATEADD(day, -1, SYSUTCDATETIME()));
GO

-- =========================
-- tb_daily_safety_log : 5건 (PAN BONA 3, PAN TAEAN 2)
-- =========================
DECLARE @V_BONA    BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_TAEAN   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V002');
DECLARE @CO_DAEHAN BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL  BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');

INSERT INTO tb_daily_safety_log
    (vessel_id, company_id, log_date, representative_name, attendees_count,
     training_content, scanned_file_url, kakao_message_id, received_via, created_at)
VALUES
    (@V_BONA,  @CO_DAEHAN, '2026-04-15', N'김대표',  8,
     N'협소공간 작업 안전수칙 / 추락방지 / 호흡보호구 착용 교육',
     '/uploads/dummy/safety/bona-20260415.pdf', 'KMSG-20260415-001', 'KAKAO',
     DATEADD(day, -3, SYSUTCDATETIME())),
    (@V_BONA,  @CO_DAEHAN, '2026-04-16', N'김대표',  9,
     N'위험물 취급 절차 / MSDS 확인 / 개인보호구 점검',
     '/uploads/dummy/safety/bona-20260416.pdf', NULL, 'EMAIL',
     DATEADD(day, -2, SYSUTCDATETIME())),
    (@V_BONA,  @CO_DAEHAN, '2026-04-17', N'박부대표', 7,
     N'선상 고소작업 / 안전대 체결 확인 / 작업허가서 숙지',
     '/uploads/dummy/safety/bona-20260417.pdf', NULL, 'UPLOAD',
     DATEADD(day, -1, SYSUTCDATETIME())),
    (@V_TAEAN, @CO_SEOUL,  '2026-04-14', N'이대표',  5,
     N'고박작업 안전수칙 / 중량물 취급 / 수신호',
     '/uploads/dummy/safety/taean-20260414.pdf', 'KMSG-20260414-002', 'KAKAO',
     DATEADD(day, -4, SYSUTCDATETIME())),
    (@V_TAEAN, @CO_SEOUL,  '2026-04-16', N'이대표',  6,
     N'작업 전 TBM / 기상조건 확인 / 비상대응 절차',
     '/uploads/dummy/safety/taean-20260416.pdf', NULL, 'UPLOAD',
     DATEADD(day, -2, SYSUTCDATETIME()));
GO
