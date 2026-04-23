-- =====================================================================
-- V12__phase6_seed.sql
-- 팬오션 안전보건 DX - Phase 6 더미 시드
--
-- 의존성:
--   V1  (tb_user, tb_company, tb_vessel)
--   V2  (tb_code: group_code='INDUSTRY')
--   V3  (admin, contract1..3, contractor1..5, companies, vessels)
--   V11 (tb_health_checkup / tb_health_vital / tb_health_consultation /
--        tb_notice / tb_form_template / tb_safety_rule / tb_audit_inspection)
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- 1. tb_health_checkup : 3건 (admin, contract1, contract2 최근 6개월)
-- =====================================================================
DECLARE @ADMIN_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_ID   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CT2_ID   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');

DECLARE @CO_DAEHAN BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL  BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN  BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');

DECLARE @NOW DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_health_checkup
    (user_id, company_id, checkup_date, hospital_name, checkup_type, summary,
     report_file_url, uploaded_by, uploaded_at)
VALUES
    (@ADMIN_ID, NULL,       DATEADD(day, -30,  @NOW), N'서울대학교병원 강남센터',   'GENERAL',
        N'고혈압 관리 필요. 공복혈당 경계치. 생활습관 개선 권고.',
        N'/uploads/health/checkup/ADM-2026.pdf', @ADMIN_ID, DATEADD(day, -30, @NOW)),

    (@CT1_ID,   @CO_DAEHAN, DATEADD(day, -120, @NOW), N'연세세브란스병원',         'GENERAL',
        N'전반적으로 양호. 총콜레스테롤 다소 높음. 재검 권고.',
        N'/uploads/health/checkup/CT1-2026.pdf', @ADMIN_ID, DATEADD(day, -120, @NOW)),

    (@CT2_ID,   @CO_SEOUL,  DATEADD(day, -60,  @NOW), N'삼성서울병원',             'SPECIAL',
        N'특수검진(소음). 청력 정상. 고지혈증 지속 관리 필요.',
        N'/uploads/health/checkup/CT2-2026.pdf', @ADMIN_ID, DATEADD(day, -60, @NOW));
GO

-- =====================================================================
-- 2. tb_health_vital : 3유저 × 3년치 (2024, 2025, 2026) = 9건
--   - admin: 고혈압 추세 악화
--   - contract1: 고지혈증 지속 + 당뇨 진행
--   - contract2: 고지혈증 지속 (조절 개선)
-- =====================================================================
DECLARE @ADMIN2_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_2_ID  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CT2_2_ID  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');

DECLARE @CK_ADMIN BIGINT = (SELECT TOP 1 id FROM tb_health_checkup WHERE user_id = @ADMIN2_ID ORDER BY id DESC);
DECLARE @CK_CT1   BIGINT = (SELECT TOP 1 id FROM tb_health_checkup WHERE user_id = @CT1_2_ID  ORDER BY id DESC);
DECLARE @CK_CT2   BIGINT = (SELECT TOP 1 id FROM tb_health_checkup WHERE user_id = @CT2_2_ID  ORDER BY id DESC);

INSERT INTO tb_health_vital
    (checkup_id, user_id, measured_date,
     systolic_bp, diastolic_bp, fasting_glucose, hba1c,
     total_cholesterol, ldl, hdl, triglyceride,
     bmi, waist_cm, smoking, drinking_per_week,
     is_hypertension, is_diabetes, is_dyslipidemia)
VALUES
    -- admin (고혈압 추세)
    (@CK_ADMIN, @ADMIN2_ID, '2024-03-15', 128, 82,  98, 5.60, 198, 120, 52, 130, 24.50, 86.00, 0, 2, 0, 0, 0),
    (@CK_ADMIN, @ADMIN2_ID, '2025-03-18', 138, 88, 102, 5.80, 210, 128, 50, 145, 25.10, 88.50, 0, 3, 1, 0, 0),
    (@CK_ADMIN, @ADMIN2_ID, '2026-03-19', 146, 94, 108, 5.90, 218, 132, 48, 158, 25.80, 90.20, 0, 3, 1, 0, 1),

    -- contract1 (고지혈증 + 당뇨 진행)
    (@CK_CT1,   @CT1_2_ID,  '2024-01-10', 122, 78, 108, 6.00, 232, 152, 42, 178, 26.20, 91.00, 1, 4, 0, 0, 1),
    (@CK_CT1,   @CT1_2_ID,  '2025-01-12', 126, 80, 118, 6.40, 245, 160, 40, 198, 26.80, 92.50, 1, 4, 0, 1, 1),
    (@CK_CT1,   @CT1_2_ID,  '2026-01-14', 130, 82, 132, 7.10, 258, 170, 38, 220, 27.40, 94.00, 1, 5, 1, 1, 1),

    -- contract2 (고지혈증 지속 - 조절 개선)
    (@CK_CT2,   @CT2_2_ID,  '2024-06-05', 118, 76, 94, 5.50, 248, 165, 46, 188, 25.00, 85.50, 0, 2, 0, 0, 1),
    (@CK_CT2,   @CT2_2_ID,  '2025-06-06', 120, 78, 96, 5.60, 235, 155, 48, 172, 24.70, 84.80, 0, 2, 0, 0, 1),
    (@CK_CT2,   @CT2_2_ID,  '2026-02-17', 118, 76, 92, 5.40, 210, 138, 50, 150, 24.30, 83.50, 0, 1, 0, 0, 1);
GO

-- =====================================================================
-- 3. tb_health_consultation : 2건
-- =====================================================================
DECLARE @ADMIN3_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_3_ID  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');

DECLARE @NOW3 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_health_consultation
    (user_id, consultation_date, consultant_name, topic, content, action_items)
VALUES
    (@ADMIN3_ID, DATEADD(day, -25, @NOW3), N'김보건 (산업보건의)',
        N'혈압 관리 상담',
        N'최근 검진 결과 수축기 146/이완기 94. 염분 섭취 과다 의심. 스트레스 높음.',
        N'1) 저염식 식단 주 5회 이상  2) 유산소 운동 주 3회 30분 이상  3) 3개월 후 재측정'),

    (@CT1_3_ID,  DATEADD(day, -40, @NOW3), N'이영양 (영양사)',
        N'당뇨 전단계 식이 상담',
        N'HbA1c 7.1로 당뇨 확진 경계. 탄수화물 과다. 야식 습관 확인.',
        N'1) 정제 탄수화물 감량  2) 야식 금지  3) 내분비내과 진료 예약  4) 1개월 내 재상담');
GO

-- =====================================================================
-- 4. tb_notice : 5건 (pinned 1 + 일반 4)
-- =====================================================================
DECLARE @ADMIN4_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT3_4_ID  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');

DECLARE @NOW4 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_notice
    (category, title, content, author_user_id, published_at, pinned,
     view_count, target_roles, expires_at)
VALUES
    ('URGENT',       N'[긴급] 4월 특별 안전점검 주간 시행 안내',
        N'4월 20일부터 26일까지 전사 특별 안전점검 주간을 시행합니다. 모든 협력사는 체크리스트를 사전 작성 후 제출 바랍니다.',
        @ADMIN4_ID, DATEADD(day, -3, @NOW4), 1,
        248, 'ADMIN,CONTRACTOR,CONTRACT_DEPT', DATEADD(day, 10, @NOW4)),

    ('ANNOUNCEMENT', N'2026년 상반기 정기 안전교육 일정 공지',
        N'상반기 안전교육이 5월 둘째 주에 진행됩니다. 온라인/오프라인 중 선택 수강 가능합니다.',
        @ADMIN4_ID, DATEADD(day, -10, @NOW4), 0,
        187, 'CONTRACTOR,CONTRACT_DEPT', DATEADD(day, 30, @NOW4)),

    ('NOTICE',       N'신규 재해조사표 양식(v2.1) 배포 안내',
        N'재해조사표 양식이 v2.1로 개정되었습니다. 양식함에서 다운로드 후 사용하시기 바랍니다.',
        @ADMIN4_ID, DATEADD(day, -15, @NOW4), 0,
        134, NULL, NULL),

    ('NOTICE',       N'포털 시스템 정기 점검 안내 (4/22 02:00-04:00)',
        N'시스템 안정화를 위해 4월 22일 새벽 2시부터 4시까지 서비스 이용이 중단됩니다.',
        @CT3_4_ID,  DATEADD(day, -5, @NOW4), 0,
        96,  NULL, DATEADD(day, 5, @NOW4)),

    ('ANNOUNCEMENT', N'근로자 의견조회 익명 제보 활성화 안내',
        N'모든 제보는 익명 처리가 가능하며, 담당 팀메일로 자동 통보됩니다. 안심하고 제보해 주세요.',
        @ADMIN4_ID, DATEADD(day, -20, @NOW4), 0,
        72,  'CONTRACTOR', NULL);
GO

-- =====================================================================
-- 5. tb_form_template : 6건
-- =====================================================================
DECLARE @ADMIN5_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');

INSERT INTO tb_form_template
    (code, category, title, description, file_name, file_path,
     file_size, mime_type, version, download_count, uploaded_by, active)
VALUES
    ('FORM-RA-001',  N'위험성평가', N'위험성평가표 (표준 양식)',
        N'작업 단위별 위험성 식별/평가/개선 기록 양식. 분기 1회 이상 갱신 권장.',
        N'risk_assessment_v2.xlsx',   N'/uploads/forms/dummy-risk-assessment.pdf',
        184320,  'application/vnd.ms-excel', 'v2.0', 342, @ADMIN5_ID, 1),

    ('FORM-AR-001',  N'재해조사', N'재해조사표 (v2.1)',
        N'산업재해 발생 시 작성하는 공식 조사 양식. 사건 발생 24시간 내 제출.',
        N'accident_report_v2_1.docx', N'/uploads/forms/dummy-accident-report.pdf',
        156672,  'application/msword', 'v2.1', 128, @ADMIN5_ID, 1),

    ('FORM-WP-001',  N'작업계획', N'작업계획서 표준 양식',
        N'작업 착수 전 일정/인원/장비/위험요인 명시 작성.',
        N'work_plan_v1.docx',         N'/uploads/forms/dummy-work-plan.pdf',
        98304,   'application/msword', 'v1.3', 205, @ADMIN5_ID, 1),

    ('FORM-SP-001',  N'안전서약', N'안전서약서',
        N'신규 배정 인원의 안전수칙 이수 및 준수 서약.',
        N'safety_pledge_v1.pdf',      N'/uploads/forms/dummy-safety-pledge.pdf',
        52428,   'application/pdf', 'v1.0', 512, @ADMIN5_ID, 1),

    ('FORM-CL-001',  N'점검리스트', N'작업 전 체크리스트 (공통)',
        N'일일 작업 착수 전 안전 점검 리스트. 팀장 서명 필수.',
        N'pre_work_checklist.pdf',    N'/uploads/forms/dummy-checklist.pdf',
        32768,   'application/pdf', 'v1.1', 284, @ADMIN5_ID, 1),

    ('FORM-HC-001',  N'보건', N'건강설문지 (연간)',
        N'연 1회 건강 관련 자가 진단 설문.',
        N'health_survey_2026.pdf',    N'/uploads/forms/dummy-health-survey.pdf',
        41984,   'application/pdf', 'v2026', 67,  @ADMIN5_ID, 1);
GO

-- =====================================================================
-- 6. tb_safety_rule : 업종별 안전수칙 (약 20건)
--   INSPECTION / LASHING / STEVEDORING / SURVEY / SHIP_SUPPLY /
--   REPAIR / PAINTING / WELDING 각 2~3개
-- =====================================================================
INSERT INTO tb_safety_rule
    (industry_code, rule_no, title, content, severity, sort_order, active)
VALUES
    -- INSPECTION (검수업) 3
    ('INSPECTION',  'SR-INS-001', N'고소작업 시 안전벨트 착용 필수',
        N'2m 이상 높이에서 검수 작업 시 **안전벨트 후크 결속**을 반드시 확인한다.\n- 후크는 반드시 D-ring 또는 고정된 구조물에 결속\n- 작업 전 육안 검사 필수',
        'CRITICAL', 10, 1),
    ('INSPECTION',  'SR-INS-002', N'홀드 진입 전 가스 측정 의무',
        N'화물 홀드 진입 전 산소·유독가스 측정을 실시하고, 결과를 기록한다.',
        'WARNING',  20, 1),
    ('INSPECTION',  'SR-INS-003', N'야간 검수 조명 확보',
        N'야간 검수 시 luxmeter 기준 200lux 이상 조명을 확보하고 보조 조명을 휴대한다.',
        'CAUTION',  30, 1),

    -- LASHING (고박업) 3
    ('LASHING',     'SR-LSH-001', N'크레인 하부 출입금지',
        N'크레인 작업 반경 및 하부 통로 **절대 출입금지**. 위반 시 즉시 작업 중단.',
        'CRITICAL', 10, 1),
    ('LASHING',     'SR-LSH-002', N'고박 장비 일일 점검',
        N'래싱 체인/터버클/파이프의 균열·변형·부식을 매일 점검하고 점검일지에 기록한다.',
        'WARNING',  20, 1),
    ('LASHING',     'SR-LSH-003', N'고박 작업 2인 1조 원칙',
        N'선상 래싱 작업은 반드시 2인 1조로 수행하며 상호 안전 확인.',
        'WARNING',  30, 1),

    -- STEVEDORING (하역업) 3
    ('STEVEDORING', 'SR-STV-001', N'지게차 작업 반경 내 보행 금지',
        N'지게차 작업 반경 5m 내 보행 금지. 보행로는 노란색 선으로 명확히 구분.',
        'CRITICAL', 10, 1),
    ('STEVEDORING', 'SR-STV-002', N'하역 작업 전 바닥 상태 확인',
        N'갑판 및 부두 바닥의 수분/기름/이물질을 제거한 후 작업 착수.',
        'CAUTION',  20, 1),
    ('STEVEDORING', 'SR-STV-003', N'컨테이너 적재 한도 준수',
        N'컨테이너 적재 단수 및 중량 한도를 초과하지 않으며, 고박 상태 점검.',
        'WARNING',  30, 1),

    -- SURVEY (검정업) 2
    ('SURVEY',      'SR-SVY-001', N'계측기 영점 확인',
        N'작업 착수 전 계측기 영점/교정 상태를 확인하고 기록지에 서명.',
        'CAUTION',  10, 1),
    ('SURVEY',      'SR-SVY-002', N'밀폐공간 진입 허가제',
        N'탱크·홀드 등 밀폐공간은 **진입 허가서** 발급 후 진입.',
        'CRITICAL', 20, 1),

    -- SHIP_SUPPLY (선용품공급업) 2
    ('SHIP_SUPPLY', 'SR-SUP-001', N'중량물 취급 허리 보호',
        N'20kg 이상 중량물은 2인 1조 또는 보조기구 사용. 허리 보호대 착용.',
        'WARNING',  10, 1),
    ('SHIP_SUPPLY', 'SR-SUP-002', N'위험물 라벨 확인',
        N'공급품 인도 시 MSDS/라벨 일치 여부 확인 후 전달.',
        'CAUTION',  20, 1),

    -- REPAIR (수리업) 3
    ('REPAIR',      'SR-RPR-001', N'LOTO (Lock-Out Tag-Out) 의무',
        N'전기·기계 수리 시 에너지원 차단 후 **잠금 및 태그 부착**.',
        'CRITICAL', 10, 1),
    ('REPAIR',      'SR-RPR-002', N'고소 작업대 사전 점검',
        N'작업대·사다리 상태 점검 후 사용. 3m 이상 고소 시 안전벨트 착용.',
        'WARNING',  20, 1),
    ('REPAIR',      'SR-RPR-003', N'수공구 전용 홀스터 사용',
        N'낙하 방지를 위해 수공구는 전용 홀스터/랜야드에 결속.',
        'CAUTION',  30, 1),

    -- PAINTING (도장업) 2
    ('PAINTING',    'SR-PNT-001', N'유기용제 취급 시 환기',
        N'밀폐공간 도장 시 강제 환기(송풍 5회/시간 이상) 및 방독 마스크 착용.',
        'CRITICAL', 10, 1),
    ('PAINTING',    'SR-PNT-002', N'정전기 방지 조치',
        N'용제 작업 구역은 본딩/접지하여 정전기 점화 위험을 제거한다.',
        'WARNING',  20, 1),

    -- WELDING (용접업) 2
    ('WELDING',     'SR-WLD-001', N'화재 감시자 배치 필수',
        N'용접·용단 작업 시 **화재 감시자 1명** 배치, 소화기 비치, 작업 종료 30분 후까지 감시.',
        'CRITICAL', 10, 1),
    ('WELDING',     'SR-WLD-002', N'보호구 완전 착용',
        N'용접면·내열 장갑·작업복 소매/바짓단 여밈 확인. 불꽃이 튀지 않도록 복장 점검.',
        'WARNING',  20, 1);
GO

-- =====================================================================
-- 7. tb_audit_inspection : 3건 (REGULAR 2 + FOLLOW_UP 1)
-- =====================================================================
DECLARE @ADMIN7_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_7_ID  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');

DECLARE @CO_BUSAN7   BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_HANBIT7  BIGINT = (SELECT id FROM tb_company WHERE business_number = '777-77-77777');

DECLARE @V_BONA7     BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_CLIPPER7  BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V004');

DECLARE @NOW7 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_audit_inspection
    (inspection_type, target_company_id, target_vessel_id, inspection_date,
     inspector_user_id, findings, action_items, status)
VALUES
    ('REGULAR',   @CO_BUSAN7,  NULL,         DATEADD(day, -45, @NOW7),
        @ADMIN7_ID,
        N'부산하역 4부두 정기 감사. 보행로 구획선 일부 마모. PPE 비치함 관리 양호.',
        N'1) 보행로 라인 재도색 (5/15까지)\n2) 지게차 후진 경고음 점검',
        'CLOSED'),

    ('REGULAR',   NULL,        @V_BONA7,     DATEADD(day, -14, @NOW7),
        @CT1_7_ID,
        N'PAN BONA 승선 점검. 소화기 유효기간 2개 만료. 구명조끼 상태 양호.',
        N'1) 소화기 2개 교체  2) 승선자 안전교육 기록 업데이트',
        'OPEN'),

    ('FOLLOW_UP', @CO_HANBIT7, @V_CLIPPER7,  DATEADD(day, -5,  @NOW7),
        @ADMIN7_ID,
        N'4/5 용접 화상 사고 후속점검. 보호구 교체 완료. 재발방지 교육 이수 확인.',
        N'1) 월 1회 PPE 점검 정례화  2) 용접 화재 감시자 배치 철저',
        'OPEN');
GO
