-- =====================================================================
-- V8__phase4_evaluation_seed.sql
-- 팬오션 안전보건 DX - Phase 4 평가/개선요청/SOM 스냅샷 더미 시드
--
-- 의존성:
--   V1 (tb_user, tb_company) / V3 (admin, contractor1..5, contract1..3, 10 companies)
--   V7 (tb_evaluation_item/evaluation/item_score/attachment/improvement/som_company_snapshot)
--
-- evaluation_no 포맷: EV-YYYYNN-NNNN  (NN = 01(H1) / 02(H2))
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- 1. tb_evaluation_item : 14개 평가 항목 시드
--    code 리스트 (다른 에이전트가 참조):
--      SAFETY_POLICY, SAFETY_MANAGER, SAFETY_BUDGET,
--      REGULAR_TRAINING, SPECIAL_TRAINING,
--      RISK_ASSESSMENT, WORK_PERMIT, PPE_PROVISION,
--      EQUIPMENT_INSPECTION, WORK_ENV_MEASURE,
--      ACCIDENT_RATE, ACCIDENT_REPORT,
--      WORKER_CONSULTATION, JOINT_INSPECTION
-- =====================================================================
INSERT INTO tb_evaluation_item
    (code, category, title, description, max_score, weight, sort_order, active)
VALUES
    ('SAFETY_POLICY',        N'경영방침·조직', N'안전보건방침 수립 및 공표',     N'사업주의 안전보건 방침 문서화·게시, 정기 재검토 여부',              10, 1.00,  1, 1),
    ('SAFETY_MANAGER',       N'경영방침·조직', N'안전보건관리자 선임',           N'법정 안전관리자/보건관리자 선임 및 자격 보유',                       10, 1.20,  2, 1),
    ('SAFETY_BUDGET',        N'경영방침·조직', N'안전보건 예산 편성',            N'연간 안전보건 예산 편성 비율 및 집행 실적',                         10, 1.00,  3, 1),
    ('REGULAR_TRAINING',     N'교육·훈련',     N'정기 안전보건교육 이수',         N'분기별 정기 안전보건교육 이수율, 교육일지 기록',                    10, 1.00,  4, 1),
    ('SPECIAL_TRAINING',     N'교육·훈련',     N'특별·신규자 교육 이수',          N'유해위험작업 특별교육 및 신규 채용자 교육 이수율',                  10, 1.00,  5, 1),
    ('RISK_ASSESSMENT',      N'위험관리',      N'위험성평가 수행',               N'작업공정별 위험성평가 수행 및 개선조치 이행',                        10, 1.50,  6, 1),
    ('WORK_PERMIT',          N'위험관리',      N'작업허가제 운영',               N'밀폐/고소/화기작업 등 작업허가서 발행·관리',                         10, 1.20,  7, 1),
    ('PPE_PROVISION',        N'위험관리',      N'개인보호구 지급·관리',           N'작업자별 PPE 지급 대장, 착용 점검, 노후품 교체',                     10, 1.00,  8, 1),
    ('EQUIPMENT_INSPECTION', N'설비·환경',     N'장비·설비 정기점검',            N'중장비/고소작업대 등 점검 주기 준수, 점검일지',                     10, 1.00,  9, 1),
    ('WORK_ENV_MEASURE',     N'설비·환경',     N'작업환경 측정',                 N'소음/분진/유해화학물질 등 작업환경 측정 및 결과조치',                10, 1.00, 10, 1),
    ('ACCIDENT_RATE',        N'재해관리',      N'재해발생률',                    N'최근 1년 재해율(천인율) 지표. 동종업계 평균 대비 산정',              10, 1.50, 11, 1),
    ('ACCIDENT_REPORT',      N'재해관리',      N'재해 조사·보고 체계',           N'재해 발생 시 조사·원인분석·재발방지대책 수립 프로세스',              10, 1.00, 12, 1),
    ('WORKER_CONSULTATION',  N'협력체계',      N'근로자 의견청취·참여',          N'안전보건협의체 운영, 근로자 제안제도',                              10, 1.00, 13, 1),
    ('JOINT_INSPECTION',     N'협력체계',      N'정기 합동점검 참여',            N'발주사(팬오션)와의 합동 안전점검 참여율 및 지적사항 조치',           10, 1.00, 14, 1);
GO

-- =====================================================================
-- 2. tb_evaluation : 8건 더미 (2026 H1 5건 + 2025 H2 APPROVED 1건 + 2026 H1 REJECTED 1건 + 2026 H1 DRAFT 1건)
--
--   상태 분포:
--     DRAFT      : 1  (대한검수 2026H1)
--     SUBMITTED  : 2  (서울고박 2026H1, 오션검정 2026H1)
--     APPROVED   : 3  (부산하역 2026H1, 한라선용품 2026H1, 대한검수 2025H2)
--     REJECTED   : 1  (동방선박수리 2026H1)
--   (합 7건; 요구 8~10건 범위 내 하한을 선택; 다양한 상태 커버)
-- =====================================================================
DECLARE @ADMIN_ID    BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_ID      BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CO_DAEHAN   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL    BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_OCEAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '444-44-44444');
DECLARE @CO_HALLA    BIGINT = (SELECT id FROM tb_company WHERE business_number = '555-55-55555');
DECLARE @CO_DONGBANG BIGINT = (SELECT id FROM tb_company WHERE business_number = '666-66-66666');

INSERT INTO tb_evaluation
    (evaluation_no, company_id, period_year, period_half, evaluation_type, evaluator_user_id,
     status, qualification_threshold, comment, submitted_at, approved_by, approved_at, rejected_reason)
VALUES
    -- DRAFT
    ('EV-202601-0001', @CO_DAEHAN,   2026, 'H1', 'REGULAR', @ADMIN_ID,
     'DRAFT',     60.00, N'초안 작성 중 - 증빙 수집 대기', NULL, NULL, NULL, NULL),

    -- SUBMITTED (미승인)
    ('EV-202601-0002', @CO_SEOUL,    2026, 'H1', 'REGULAR', @ADMIN_ID,
     'SUBMITTED', 60.00, N'제출 완료. 승인 대기.', DATEADD(day, -5, SYSUTCDATETIME()), NULL, NULL, NULL),
    ('EV-202601-0003', @CO_OCEAN,    2026, 'H1', 'REGULAR', @ADMIN_ID,
     'SUBMITTED', 60.00, N'제출 완료. 1차 검토 진행 중.', DATEADD(day, -3, SYSUTCDATETIME()), NULL, NULL, NULL),

    -- APPROVED (3건)
    ('EV-202601-0004', @CO_BUSAN,    2026, 'H1', 'REGULAR', @ADMIN_ID,
     'APPROVED',  60.00, N'전반적으로 양호. 재해관리 우수.', DATEADD(day, -20, SYSUTCDATETIME()), @ADMIN_ID, DATEADD(day, -15, SYSUTCDATETIME()), NULL),
    ('EV-202601-0005', @CO_HALLA,    2026, 'H1', 'REGULAR', @ADMIN_ID,
     'APPROVED',  60.00, N'교육 이수율 높음. 적격.', DATEADD(day, -18, SYSUTCDATETIME()), @ADMIN_ID, DATEADD(day, -12, SYSUTCDATETIME()), NULL),
    ('EV-202502-0001', @CO_DAEHAN,   2025, 'H2', 'REGULAR', @ADMIN_ID,
     'APPROVED',  60.00, N'2025년 하반기 정기평가 적격.', DATEADD(day, -120, SYSUTCDATETIME()), @ADMIN_ID, DATEADD(day, -110, SYSUTCDATETIME()), NULL),

    -- REJECTED
    ('EV-202601-0006', @CO_DONGBANG, 2026, 'H1', 'REGULAR', @ADMIN_ID,
     'REJECTED',  60.00, N'부적격 - 재해율 기준 초과', DATEADD(day, -10, SYSUTCDATETIME()), @ADMIN_ID, DATEADD(day, -7, SYSUTCDATETIME()),
     N'최근 1년 재해율이 동종업계 평균 대비 과다. 재해관리 항목 기준 미달.');
GO

-- =====================================================================
-- 3. tb_evaluation_item_score : 각 평가 × 14 항목
--    점수 정책:
--      DRAFT      : 일부 NULL 허용 (5개만 입력)
--      SUBMITTED  : 전부 입력, 7~9 범위
--      APPROVED   : 전부 입력, 7~10 범위 (합격)
--      REJECTED   : 전부 입력, 3~6 범위 (재해항목 특히 낮음)
--    sort_order 기반으로 item 순회하며 pseudo-random 배분.
-- =====================================================================
DECLARE @evalId BIGINT, @status VARCHAR(20);

DECLARE eval_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT id, status FROM tb_evaluation ORDER BY id;

OPEN eval_cursor;
FETCH NEXT FROM eval_cursor INTO @evalId, @status;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO tb_evaluation_item_score
        (evaluation_id, item_id, score, max_score, weight, weighted_score, comment)
    SELECT
        @evalId,
        i.id,
        CASE
            WHEN @status = 'DRAFT'     AND i.sort_order > 5 THEN NULL
            WHEN @status = 'DRAFT'                          THEN CAST(6 + (i.sort_order % 4) AS DECIMAL(5,2))
            WHEN @status = 'SUBMITTED'                      THEN CAST(7 + (i.sort_order % 3) AS DECIMAL(5,2))
            WHEN @status = 'APPROVED'                       THEN CAST(7 + ((i.sort_order * 7) % 4) AS DECIMAL(5,2))
            WHEN @status = 'REJECTED'  AND i.category = N'재해관리' THEN CAST(3 AS DECIMAL(5,2))
            WHEN @status = 'REJECTED'                       THEN CAST(4 + (i.sort_order % 3) AS DECIMAL(5,2))
        END AS score,
        CAST(i.max_score AS DECIMAL(5,2)),
        i.weight,
        CASE
            WHEN @status = 'DRAFT'     AND i.sort_order > 5 THEN NULL
            WHEN @status = 'DRAFT'                          THEN CAST((6 + (i.sort_order % 4)) * i.weight AS DECIMAL(7,2))
            WHEN @status = 'SUBMITTED'                      THEN CAST((7 + (i.sort_order % 3)) * i.weight AS DECIMAL(7,2))
            WHEN @status = 'APPROVED'                       THEN CAST((7 + ((i.sort_order * 7) % 4)) * i.weight AS DECIMAL(7,2))
            WHEN @status = 'REJECTED'  AND i.category = N'재해관리' THEN CAST(3 * i.weight AS DECIMAL(7,2))
            WHEN @status = 'REJECTED'                       THEN CAST((4 + (i.sort_order % 3)) * i.weight AS DECIMAL(7,2))
        END AS weighted_score,
        NULL
    FROM tb_evaluation_item i
    WHERE i.active = 1 AND i.deleted = 0;

    FETCH NEXT FROM eval_cursor INTO @evalId, @status;
END;

CLOSE eval_cursor;
DEALLOCATE eval_cursor;
GO

-- =====================================================================
-- 4. tb_evaluation 집계 업데이트 (total_score / max_total_score / percentage / qualified)
--    DRAFT 는 집계 null 유지.
-- =====================================================================
UPDATE e
   SET total_score      = agg.total_weighted,
       max_total_score  = agg.max_weighted,
       score_percentage = CASE WHEN agg.max_weighted > 0
                               THEN CAST(agg.total_weighted * 100.0 / agg.max_weighted AS DECIMAL(5,2))
                               ELSE NULL END,
       qualified        = CASE WHEN agg.max_weighted > 0
                                    AND (agg.total_weighted * 100.0 / agg.max_weighted) >= e.qualification_threshold
                               THEN 1 ELSE 0 END,
       updated_at       = SYSUTCDATETIME()
  FROM tb_evaluation e
 CROSS APPLY (
        SELECT
            SUM(s.weighted_score)              AS total_weighted,
            SUM(s.max_score * s.weight)        AS max_weighted
          FROM tb_evaluation_item_score s
         WHERE s.evaluation_id = e.id
           AND s.score IS NOT NULL
 ) agg
 WHERE e.status <> 'DRAFT';
GO

-- =====================================================================
-- 5. tb_evaluation_attachment : APPROVED / SUBMITTED 건에 1~2개 첨부
-- =====================================================================
DECLARE @ADMIN_ID2 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');

INSERT INTO tb_evaluation_attachment
    (evaluation_id, item_id, file_name, file_path, file_size, mime_type, uploaded_by)
SELECT
    e.id,
    NULL,
    N'평가증빙_' + e.evaluation_no + N'.pdf',
    N'/uploads/evaluation/' + e.evaluation_no + N'/summary.pdf',
    524288,
    'application/pdf',
    @ADMIN_ID2
  FROM tb_evaluation e
 WHERE e.status IN ('APPROVED','SUBMITTED');

-- APPROVED 건에 항목별 증빙 추가 (위험성평가 RISK_ASSESSMENT)
INSERT INTO tb_evaluation_attachment
    (evaluation_id, item_id, file_name, file_path, file_size, mime_type, uploaded_by)
SELECT
    e.id,
    i.id,
    N'위험성평가_' + e.evaluation_no + N'.pdf',
    N'/uploads/evaluation/' + e.evaluation_no + N'/risk_assessment.pdf',
    786432,
    'application/pdf',
    @ADMIN_ID2
  FROM tb_evaluation e
 CROSS JOIN tb_evaluation_item i
 WHERE e.status = 'APPROVED'
   AND i.code   = 'RISK_ASSESSMENT';
GO

-- =====================================================================
-- 6. tb_evaluation_improvement : APPROVED 3건 중 각 1건 (OPEN / RESPONDED / CLOSED)
-- =====================================================================
DECLARE @ADMIN3 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_3  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');

DECLARE @EV_BUSAN  BIGINT = (SELECT id FROM tb_evaluation WHERE evaluation_no = 'EV-202601-0004');
DECLARE @EV_HALLA  BIGINT = (SELECT id FROM tb_evaluation WHERE evaluation_no = 'EV-202601-0005');
DECLARE @EV_DAEHAN BIGINT = (SELECT id FROM tb_evaluation WHERE evaluation_no = 'EV-202502-0001');

DECLARE @IT_PPE      BIGINT = (SELECT id FROM tb_evaluation_item WHERE code = 'PPE_PROVISION');
DECLARE @IT_ENV      BIGINT = (SELECT id FROM tb_evaluation_item WHERE code = 'WORK_ENV_MEASURE');
DECLARE @IT_TRAINING BIGINT = (SELECT id FROM tb_evaluation_item WHERE code = 'REGULAR_TRAINING');

-- OPEN
INSERT INTO tb_evaluation_improvement
    (evaluation_id, item_id, requested_by, requested_at, request_content,
     response_content, response_user_id, responded_at, response_due_date, status)
VALUES
    (@EV_BUSAN, @IT_PPE, @ADMIN3, DATEADD(day, -14, SYSUTCDATETIME()),
     N'개인보호구(PPE) 지급 대장 최신화 및 노후품 교체 내역 제출 바랍니다.',
     NULL, NULL, NULL, DATEADD(day, 16, SYSUTCDATETIME()), 'OPEN'),

-- RESPONDED
    (@EV_HALLA, @IT_ENV, @ADMIN3, DATEADD(day, -11, SYSUTCDATETIME()),
     N'작업환경 측정 결과 중 분진 항목 기준 초과 구간에 대한 개선계획 제출 요청.',
     N'해당 구간 국소배기장치 증설 완료 및 재측정 결과 첨부합니다.',
     @CT1_3, DATEADD(day, -4, SYSUTCDATETIME()), DATEADD(day, 19, SYSUTCDATETIME()), 'RESPONDED'),

-- CLOSED
    (@EV_DAEHAN, @IT_TRAINING, @ADMIN3, DATEADD(day, -100, SYSUTCDATETIME()),
     N'정기 안전보건교육 이수율 90% 미만 근로자 대상 보충교육 실시 요청.',
     N'보충교육 2회차 실시 완료. 이수율 100% 달성.',
     @CT1_3, DATEADD(day, -80, SYSUTCDATETIME()), DATEADD(day, -70, SYSUTCDATETIME()), 'CLOSED');
GO

-- =====================================================================
-- 7. tb_som_company_snapshot : 10개 협력사 사업자번호별 스냅샷
-- =====================================================================
INSERT INTO tb_som_company_snapshot
    (business_number, company_name, ceo_name, address, industry, employee_count, annual_revenue, last_synced_at)
SELECT
    c.business_number,
    c.name,
    c.ceo_name,
    c.address,
    c.industry_code,
    -- 업종별 더미 인원 (결정론적 pseudo-random)
    50 + (CAST(RIGHT(c.business_number, 2) AS INT) % 80) AS employee_count,
    -- 더미 매출 (억 단위 × 10000)
    CAST((100 + (CAST(RIGHT(c.business_number, 3) AS INT) % 900)) * 100000000.0 AS DECIMAL(18,2)) AS annual_revenue,
    DATEADD(day, -1, SYSUTCDATETIME())
  FROM tb_company c
 WHERE c.deleted = 0
   AND NOT EXISTS (
       SELECT 1 FROM tb_som_company_snapshot s WHERE s.business_number = c.business_number
   );
GO
