-- =====================================================================
-- V10__phase5_seed.sql
-- 팬오션 안전보건 DX - Phase 5 더미 시드
--
-- 의존성:
--   V1 (tb_user, tb_company, tb_vessel, tb_department)
--   V3 (admin, contractor1..5, contract1..3, 10 companies, 8 vessels, 5 departments)
--   V9 (tb_worker_voice / tb_voice_attachment / tb_industrial_accident /
--       tb_safety_performance_land / tb_safety_performance_sea / tb_sea_crew_incident)
--
-- 포맷:
--   voice_no    : WV-YYYYMMDD-NNNN
--   accident_no : IA-YYYYMMDD-NNNN
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- 1. tb_worker_voice : 8건 (NEAR_MISS 3 / INCIDENT 2 / INQUIRY 3)
--    status 분포: SUBMITTED, TRIAGED, IN_PROGRESS, RESOLVED, CLOSED 커버
-- =====================================================================
DECLARE @ADMIN_ID    BIGINT = (SELECT id FROM tb_user    WHERE username = 'admin');
DECLARE @CT1_ID      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract1');
DECLARE @CT2_ID      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract2');
DECLARE @CT3_ID      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract3');
DECLARE @C1_ID       BIGINT = (SELECT id FROM tb_user    WHERE username = 'contractor1');
DECLARE @C2_ID       BIGINT = (SELECT id FROM tb_user    WHERE username = 'contractor2');
DECLARE @C3_ID       BIGINT = (SELECT id FROM tb_user    WHERE username = 'contractor3');

DECLARE @CO_DAEHAN   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL    BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_OCEAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '444-44-44444');
DECLARE @CO_HALLA    BIGINT = (SELECT id FROM tb_company WHERE business_number = '555-55-55555');
DECLARE @CO_DONGBANG BIGINT = (SELECT id FROM tb_company WHERE business_number = '666-66-66666');
DECLARE @CO_HANBIT   BIGINT = (SELECT id FROM tb_company WHERE business_number = '777-77-77777');
DECLARE @CO_TAEYANG  BIGINT = (SELECT id FROM tb_company WHERE business_number = '888-88-88888');

DECLARE @V_BONA      BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_TAEAN     BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V002');
DECLARE @V_VISION    BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V003');
DECLARE @V_CLIPPER   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V004');
DECLARE @V_HARMONY   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V005');
DECLARE @V_PIONEER   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V006');
DECLARE @V_VICTORY   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V007');
DECLARE @V_DILIGENCE BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V008');

DECLARE @NOW DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_worker_voice
    (voice_no, voice_type, title, content, company_id, vessel_id, reporter_user_id,
     reporter_anonymous, severity, status, assigned_to, resolved_at, resolution, email_sent_to, created_at)
VALUES
    -- NEAR_MISS (3건)
    ('WV-20260320-0001', 'NEAR_MISS',   N'고소작업 중 안전벨트 미체결 목격',
     N'PAN BONA 상갑판에서 작업자가 고소작업 중 안전벨트 후크를 결속하지 않은 상태로 이동하는 것을 목격했습니다.',
     @CO_BUSAN, @V_BONA, @C3_ID, 0, NULL, 'TRIAGED', @CT1_ID,
     NULL, NULL, N'safety@panocean.com', DATEADD(day, -29, @NOW)),

    ('WV-20260328-0002', 'NEAR_MISS',   N'하역장 크레인 하부 보행 위험',
     N'부산하역 작업장에서 크레인 작업 반경 내를 지나가는 보행자가 있어 사고로 이어질 뻔했습니다.',
     @CO_BUSAN, NULL, @C3_ID, 1, NULL, 'IN_PROGRESS', @CT2_ID,
     NULL, NULL, N'safety@panocean.com', DATEADD(day, -21, @NOW)),

    ('WV-20260402-0003', 'NEAR_MISS',   N'계단 손잡이 파손 발견',
     N'PAN TAEAN 기관실 진입 계단 손잡이가 부식되어 흔들립니다. 교체 필요.',
     @CO_DAEHAN, @V_TAEAN, @C1_ID, 0, NULL, 'RESOLVED', @CT3_ID,
     DATEADD(day, -8, @NOW), N'손잡이 전량 교체 완료 (2026-04-10). 재점검 정상.',
     N'safety@panocean.com;vessel@panocean.com', DATEADD(day, -16, @NOW)),

    -- INCIDENT (2건) — severity 필수
    ('WV-20260310-0004', 'INCIDENT',    N'도장작업 중 손가락 열상 발생',
     N'한빛도장 작업자 1명이 도장 보조기구 교체 중 커터날에 손가락이 베이는 사고가 발생. 응급처치 후 병원 이송.',
     @CO_HANBIT, NULL, @C1_ID, 0, 'MEDIUM', 'RESOLVED', @ADMIN_ID,
     DATEADD(day, -18, @NOW), N'원인분석 완료, 전원 보호장갑 지급 및 재교육 완료. 재해조사표 제출.',
     N'safety@panocean.com;hr@panocean.com', DATEADD(day, -39, @NOW)),

    ('WV-20260415-0005', 'INCIDENT',    N'용접작업 중 화상 발생',
     N'태양용접 작업자 1명 용접 불꽃이 작업복 안으로 튀어 우측 팔뚝 2도 화상. 치료 진행 중.',
     @CO_TAEYANG, @V_CLIPPER, @C2_ID, 0, 'HIGH', 'IN_PROGRESS', @ADMIN_ID,
     NULL, NULL, N'safety@panocean.com;hr@panocean.com', DATEADD(day, -3, @NOW)),

    -- INQUIRY (3건)
    ('WV-20260325-0006', 'INQUIRY',     N'개인보호구 지급 주기 문의',
     N'안전화 교체 주기가 어떻게 되는지, 낡은 경우 개별 신청 가능한지 확인 부탁드립니다.',
     @CO_SEOUL, NULL, @C2_ID, 0, NULL, 'RESOLVED', @CT1_ID,
     DATEADD(day, -20, @NOW), N'안전화 지급 기준 6개월 주기 안내. 파손 시 즉시 교체 신청 가능.',
     N'hr@panocean.com', DATEADD(day, -24, @NOW)),

    ('WV-20260405-0007', 'INQUIRY',     N'안전교육 온라인 수강 가능 여부',
     N'해외 출장이 많은 직원 대상으로 안전교육을 온라인으로 이수할 수 있는지 문의드립니다.',
     @CO_OCEAN, NULL, @C1_ID, 0, NULL, 'SUBMITTED', NULL,
     NULL, NULL, N'hr@panocean.com', DATEADD(day, -13, @NOW)),

    ('WV-20260412-0008', 'INQUIRY',     N'해상 응급의료 체계 확인',
     N'선박에서 부상 발생 시 연락 체계 및 대응 매뉴얼 공유 요청드립니다.',
     @CO_HALLA, @V_HARMONY, @C1_ID, 0, NULL, 'CLOSED', @CT3_ID,
     DATEADD(day, -4, @NOW), N'응급의료 매뉴얼 v2.3 배포 및 숙지 확인 완료.',
     N'safety@panocean.com;vessel@panocean.com', DATEADD(day, -6, @NOW));
GO

-- =====================================================================
-- 2. tb_industrial_accident : 5건 (기존 협력사 5곳)
-- =====================================================================
DECLARE @ADMIN_ID2    BIGINT = (SELECT id FROM tb_user    WHERE username = 'admin');
DECLARE @CT1_ID2      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract1');
DECLARE @CT2_ID2      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract2');

DECLARE @CO_DAEHAN2   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_BUSAN2    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_DONGBANG2 BIGINT = (SELECT id FROM tb_company WHERE business_number = '666-66-66666');
DECLARE @CO_HANBIT2   BIGINT = (SELECT id FROM tb_company WHERE business_number = '777-77-77777');
DECLARE @CO_TAEYANG2  BIGINT = (SELECT id FROM tb_company WHERE business_number = '888-88-88888');

DECLARE @V_BONA2      BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_CLIPPER2   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V004');
DECLARE @V_PIONEER2   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V006');

INSERT INTO tb_industrial_accident
    (accident_no, company_id, business_number, vessel_id, accident_date,
     accident_location, victim_name, victim_age, victim_gender, victim_role,
     accident_type, severity, description, treatment_days, absence_days,
     reported_by, reported_at, report_file_url)
VALUES
    ('IA-20260308-0001', @CO_HANBIT2, '777-77-77777', NULL,          '2026-03-08',
     N'광양조선소 3번 도크 도장작업장', N'김도장', 42, 'M', N'도장공',
     'CUT',      'MINOR',  N'도장 보조기구 교체 중 커터날에 우측 검지 열상. 5cm 자상.', 7, 3,
     @CT1_ID2, DATEADD(day, -40, SYSUTCDATETIME()), N'/uploads/accident/IA-20260308-0001/report.pdf'),

    ('IA-20260315-0002', @CO_BUSAN2, '333-33-33333', NULL,           '2026-03-15',
     N'부산항 4부두 하역장', N'박하역', 51, 'M', N'지게차 기사',
     'STRUCK',   'SERIOUS', N'지게차 후진 중 적재물과 추돌. 운전자 흉부 타박상 및 갈비뼈 골절.', 30, 21,
     @ADMIN_ID2, DATEADD(day, -33, SYSUTCDATETIME()), N'/uploads/accident/IA-20260315-0002/report.pdf'),

    ('IA-20260322-0003', @CO_DONGBANG2, '666-66-66666', @V_CLIPPER2, '2026-03-22',
     N'PAN CLIPPER 기관실', N'강수리', 38, 'M', N'정비기사',
     'FALL',     'SERIOUS', N'기관실 사다리에서 발을 헛디뎌 2m 추락. 우측 발목 골절 및 요추 염좌.', 45, 35,
     @CT2_ID2, DATEADD(day, -26, SYSUTCDATETIME()), N'/uploads/accident/IA-20260322-0003/report.pdf'),

    ('IA-20260405-0004', @CO_TAEYANG2, '888-88-88888', @V_CLIPPER2,  '2026-04-05',
     N'PAN CLIPPER 갑판 용접 작업장', N'윤용접', 35, 'M', N'용접공',
     'BURN',     'SERIOUS', N'용접 불꽃이 작업복 안으로 튀어 우측 팔뚝 2도 화상 (면적 약 8%).', 21, 14,
     @ADMIN_ID2, DATEADD(day, -12, SYSUTCDATETIME()), N'/uploads/accident/IA-20260405-0004/report.pdf'),

    ('IA-20260410-0005', @CO_DAEHAN2, '111-11-11111', @V_BONA2,      '2026-04-10',
     N'PAN BONA 1번 홀드', N'이검수', 29, 'M', N'검수원',
     'ELECTRIC', 'MINOR',   N'임시조명 점검 중 노후 케이블 누전으로 감전. 경미한 전기쇼크.', 3, 1,
     @CT1_ID2, DATEADD(day, -7, SYSUTCDATETIME()), N'/uploads/accident/IA-20260410-0005/report.pdf');
GO

-- =====================================================================
-- 3. tb_safety_performance_land : 12건 (5개 부서 × 최근 2~3개월)
--    2026-02 / 2026-03 / 2026-04 분포 (월 중복 UNIQUE 보장)
-- =====================================================================
DECLARE @ADMIN_ID3 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_ID3   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CT2_ID3   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');
DECLARE @CT3_ID3   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');

DECLARE @D_SAFETY BIGINT = (SELECT id FROM tb_department WHERE code = 'SAFETY_MGMT');
DECLARE @D_PURCH  BIGINT = (SELECT id FROM tb_department WHERE code = 'PURCHASING');
DECLARE @D_OPER   BIGINT = (SELECT id FROM tb_department WHERE code = 'OPERATION');
DECLARE @D_VESSEL BIGINT = (SELECT id FROM tb_department WHERE code = 'VESSEL_MGMT');
DECLARE @D_SALES  BIGINT = (SELECT id FROM tb_department WHERE code = 'SALES');

INSERT INTO tb_safety_performance_land
    (department_id, period_year, period_month, manhours,
     accident_count, lost_time_count, fatality_count, trir, ltir,
     budget_planned, budget_used, fcm_project_code, vbp_project_code,
     reported_by, comment)
VALUES
    -- SAFETY_MGMT (3개월)
    (@D_SAFETY, 2026, 2, 18400, 0, 0, 0, 0.000, 0.000, 15000000.00, 12800000.00, 'FCM-SAF-2026', 'VBP-SAF-26H1', @ADMIN_ID3, N'2월 무재해 달성'),
    (@D_SAFETY, 2026, 3, 19200, 1, 0, 0, 1.042, 0.000, 15000000.00, 14200000.00, 'FCM-SAF-2026', 'VBP-SAF-26H1', @ADMIN_ID3, N'경미 1건 (응급처치)'),
    (@D_SAFETY, 2026, 4, 16800, 0, 0, 0, 0.000, 0.000, 15000000.00,  8100000.00, 'FCM-SAF-2026', 'VBP-SAF-26H1', @ADMIN_ID3, N'4월 중간 집계'),
    -- PURCHASING (2개월)
    (@D_PURCH,  2026, 3, 14400, 0, 0, 0, 0.000, 0.000,  8000000.00,  6200000.00, 'FCM-PUR-2026', NULL,          @CT1_ID3,   N'구매 조달 안전교육 완료'),
    (@D_PURCH,  2026, 4, 13600, 0, 0, 0, 0.000, 0.000,  8000000.00,  4100000.00, 'FCM-PUR-2026', NULL,          @CT1_ID3,   N'PPE 입고 정상'),
    -- OPERATION (3개월)
    (@D_OPER,   2026, 2, 22400, 1, 1, 0, 0.893, 0.893, 12000000.00, 10500000.00, 'FCM-OPR-2026', 'VBP-OPR-26H1', @CT2_ID3,   N'운영팀 LTIR 발생'),
    (@D_OPER,   2026, 3, 23200, 2, 1, 0, 1.724, 0.862, 12000000.00, 11300000.00, 'FCM-OPR-2026', 'VBP-OPR-26H1', @CT2_ID3,   N'경미 2건'),
    (@D_OPER,   2026, 4, 20800, 0, 0, 0, 0.000, 0.000, 12000000.00,  6800000.00, 'FCM-OPR-2026', 'VBP-OPR-26H1', @CT2_ID3,   N'개선활동 효과'),
    -- VESSEL_MGMT (2개월)
    (@D_VESSEL, 2026, 3, 18400, 1, 0, 0, 1.087, 0.000, 18000000.00, 16400000.00, 'FCM-VSL-2026', 'VBP-VSL-26H1', @CT3_ID3,   N'선박관리 경미 1건'),
    (@D_VESSEL, 2026, 4, 17200, 1, 1, 0, 1.163, 1.163, 18000000.00,  9500000.00, 'FCM-VSL-2026', 'VBP-VSL-26H1', @CT3_ID3,   N'추락 사고 1건'),
    -- SALES (2개월)
    (@D_SALES,  2026, 3, 11200, 0, 0, 0, 0.000, 0.000,  5000000.00,  3200000.00, NULL,           NULL,          @ADMIN_ID3, N'영업팀 무재해'),
    (@D_SALES,  2026, 4, 10800, 0, 0, 0, 0.000, 0.000,  5000000.00,  1800000.00, NULL,           NULL,          @ADMIN_ID3, N'4월 중간 집계');
GO

-- =====================================================================
-- 4. tb_safety_performance_sea : 16건 (8선박 × 2개월: 2026-03, 2026-04)
-- =====================================================================
DECLARE @U_ADMIN_SEA BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @U_CT3_SEA   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');

DECLARE @VS_BONA      BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V001');
DECLARE @VS_TAEAN     BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V002');
DECLARE @VS_VISION    BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V003');
DECLARE @VS_CLIPPER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V004');
DECLARE @VS_HARMONY   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V005');
DECLARE @VS_PIONEER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V006');
DECLARE @VS_VICTORY   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V007');
DECLARE @VS_DILIGENCE BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V008');

INSERT INTO tb_safety_performance_sea
    (vessel_id, period_year, period_month, crew_count,
     illness_count, injury_count, evacuation_count, sick_leave_days,
     pos_sm_synced_at, excel_upload_id, uploaded_by, comment)
VALUES
    -- 2026-03 (8건)
    (@VS_BONA,      2026, 3, 24, 1, 0, 0,  3, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V001', @U_ADMIN_SEA, N'3월 정기 항해, 감기 1건'),
    (@VS_TAEAN,     2026, 3, 22, 0, 1, 0,  5, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V002', @U_ADMIN_SEA, N'갑판수 부상 1건'),
    (@VS_VISION,    2026, 3, 20, 0, 0, 0,  0, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V003', @U_ADMIN_SEA, N'무재해'),
    (@VS_CLIPPER,   2026, 3, 23, 1, 1, 1, 12, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V004', @U_ADMIN_SEA, N'조리장 심혈관 하선'),
    (@VS_HARMONY,   2026, 3, 18, 0, 0, 0,  0, NULL,                                 'EXCEL-2026M03-V005', @U_CT3_SEA,   N'드라이독 중'),
    (@VS_PIONEER,   2026, 3, 21, 2, 0, 0,  7, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V006', @U_CT3_SEA,   N'독감 2건'),
    (@VS_VICTORY,   2026, 3, 19, 0, 0, 0,  0, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V007', @U_CT3_SEA,   N'무재해'),
    (@VS_DILIGENCE, 2026, 3, 22, 0, 1, 0,  4, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V008', @U_CT3_SEA,   N'기관수 경미 부상'),
    -- 2026-04 (8건)
    (@VS_BONA,      2026, 4, 24, 0, 0, 0,  0, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V001', @U_ADMIN_SEA, N'4월 무재해'),
    (@VS_TAEAN,     2026, 4, 22, 1, 0, 0,  3, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V002', @U_ADMIN_SEA, N'감기 1건'),
    (@VS_VISION,    2026, 4, 20, 0, 0, 0,  0, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V003', @U_ADMIN_SEA, N'무재해'),
    (@VS_CLIPPER,   2026, 4, 23, 0, 1, 0, 14, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V004', @U_ADMIN_SEA, N'용접 화상 1건'),
    (@VS_HARMONY,   2026, 4, 18, 0, 0, 0,  0, NULL,                                 'EXCEL-2026M04-V005', @U_CT3_SEA,   N'드라이독 연장'),
    (@VS_PIONEER,   2026, 4, 21, 1, 0, 0,  4, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V006', @U_CT3_SEA,   N'위장염 1건'),
    (@VS_VICTORY,   2026, 4, 19, 0, 0, 0,  0, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V007', @U_CT3_SEA,   N'무재해'),
    (@VS_DILIGENCE, 2026, 4, 22, 0, 1, 1,  8, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V008', @U_CT3_SEA,   N'갑판장 낙상 하선');
GO

-- =====================================================================
-- 5. tb_sea_crew_incident : 10건 (질병/부상 상세)
-- =====================================================================
DECLARE @VC_BONA      BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V001');
DECLARE @VC_TAEAN     BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V002');
DECLARE @VC_CLIPPER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V004');
DECLARE @VC_PIONEER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V006');
DECLARE @VC_DILIGENCE BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V008');

INSERT INTO tb_sea_crew_incident
    (vessel_id, period_year, period_month, crew_name, crew_role,
     incident_type, incident_date, diagnosis, evacuation_required,
     return_to_duty_date, excel_upload_id)
VALUES
    (@VC_BONA,      2026, 3, N'김갑판', N'갑판수',  'ILLNESS', '2026-03-12', N'감기몸살',              0, '2026-03-15', 'EXCEL-2026M03-V001'),
    (@VC_TAEAN,     2026, 3, N'이기관', N'기관수',  'INJURY',  '2026-03-18', N'좌측 발등 타박상',      0, '2026-03-22', 'EXCEL-2026M03-V002'),
    (@VC_CLIPPER,   2026, 3, N'박조리', N'조리장',  'ILLNESS', '2026-03-05', N'고혈압 악화',           1, NULL,         'EXCEL-2026M03-V004'),
    (@VC_CLIPPER,   2026, 3, N'최선장', N'선장',    'INJURY',  '2026-03-24', N'우측 손목 염좌',        0, '2026-03-28', 'EXCEL-2026M03-V004'),
    (@VC_PIONEER,   2026, 3, N'한기관', N'기관장',  'ILLNESS', '2026-03-09', N'독감 A형',              0, '2026-03-14', 'EXCEL-2026M03-V006'),
    (@VC_PIONEER,   2026, 3, N'조항해', N'항해사',  'ILLNESS', '2026-03-20', N'식중독',                0, '2026-03-23', 'EXCEL-2026M03-V006'),
    (@VC_TAEAN,     2026, 4, N'강갑판', N'갑판수',  'ILLNESS', '2026-04-02', N'장염',                  0, '2026-04-05', 'EXCEL-2026M04-V002'),
    (@VC_CLIPPER,   2026, 4, N'윤용접', N'용접사',  'INJURY',  '2026-04-05', N'우측 팔뚝 2도 화상',    0, NULL,         'EXCEL-2026M04-V004'),
    (@VC_PIONEER,   2026, 4, N'서조기', N'조기수',  'ILLNESS', '2026-04-11', N'위장염',                0, '2026-04-15', 'EXCEL-2026M04-V006'),
    (@VC_DILIGENCE, 2026, 4, N'정갑판', N'갑판장',  'INJURY',  '2026-04-14', N'계단 낙상 요추 염좌',   1, NULL,         'EXCEL-2026M04-V008');
GO
