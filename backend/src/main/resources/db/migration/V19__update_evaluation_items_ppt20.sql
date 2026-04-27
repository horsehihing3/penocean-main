-- =====================================================================
-- V19__update_evaluation_items_ppt20.sql
-- [2026-04-24] PPT 슬라이드 20 기준으로 평가 항목 전체 교체
--   기존 14개 → 21개 (구분 6개, 항목 13개 + 추가 가산점 8개)
--   구분: 안전보건 관리체계(20) / 실행수준(35) / 운영관리(25)
--          / 재해발생 수준(15) / 법령위반(5) / 추가 가산점항목(10)
-- =====================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- 1. FK 참조 정리 (CASCADE 없는 FK 선행 처리)
UPDATE tb_evaluation_improvement SET item_id = NULL WHERE item_id IS NOT NULL;
GO

UPDATE tb_evaluation_attachment SET item_id = NULL WHERE item_id IS NOT NULL;
GO

DELETE FROM tb_evaluation_item_score;
GO

DELETE FROM tb_evaluation_item;
GO

-- 2. PPT 슬라이드 20 기준 21개 항목 삽입
INSERT INTO tb_evaluation_item
    (code, category, title, description, max_score, weight, sort_order, active)
VALUES
    -- ■ 안전보건 관리체계 (배점 합계 20점)
    ('GENERAL_PRINCIPLE',  N'안전보건 관리체계', N'일반원칙',
     N'안전보건방침 적정 여부',
     5,  1.00,  1, 1),

    ('PLAN_ESTABLISH',     N'안전보건 관리체계', N'계획수립',
     N'산업재해예방 활동에 대한 수급인의 이행계획 적정 여부',
     10, 1.00,  2, 1),

    ('STRUCTURE_DUTY',     N'안전보건 관리체계', N'구조 및 책임',
     N'이행계획 추진을 위한 구성원의 역할 분담',
     5,  1.00,  3, 1),

    -- ■ 실행수준 (배점 합계 35점)
    ('RISK_ASSESSMENT',    N'실행수준', N'위험성평가',
     N'도급작업의 위험성평가 결과에 대한 이해수준 및 자체 유해·위험요인 평가수준',
     5,  1.00,  4, 1),

    ('SAFETY_INSPECTION',  N'실행수준', N'안전점검',
     N'안전점검 및 모니터링 (보호구 착용확인 포함)',
     10, 1.00,  5, 1),

    ('COMPLIANCE_CHECK',   N'실행수준', N'이행확인',
     N'안전조치 이행여부 확인 (도급업체의 지도조언에 대한 이행 포함)',
     10, 1.00,  6, 1),

    ('EDUCATION_RECORD',   N'실행수준', N'교육 및 기록',
     N'안전보건 교육 계획 및 기록관리',
     5,  1.00,  7, 1),

    ('WORK_PERMIT',        N'실행수준', N'안전작업 허가',
     N'유해·위험작업에 대한 안전작업허가 이행수준',
     5,  1.00,  8, 1),

    -- ■ 운영관리 (배점 합계 25점)
    ('SIGNAL_CONTACT',     N'운영관리', N'신호 및 연락체계',
     N'도급/수급업체 간 신호/연락 체계',
     5,  1.00,  9, 1),

    ('HAZMAT_FACILITY',    N'운영관리', N'위험물질 및 설비',
     N'유해·위험 물질 및 취급 기계·기구 및 설비의 안전성 확인',
     10, 1.00, 10, 1),

    ('EMERGENCY_PLAN',     N'운영관리', N'비상대책',
     N'비상시 대피 및 피해최소화대책 (고용부, 소방서, 병원 포함)',
     10, 1.00, 11, 1),

    -- ■ 재해발생 수준 (배점 합계 15점)
    ('ACCIDENT_STATUS',    N'재해발생 수준', N'산업재해 현황',
     N'최근 3년간 산업재해 발생 현황',
     15, 1.00, 12, 1),

    -- ■ 법령위반 (배점 합계 5점)
    ('LAW_VIOLATION',      N'법령위반', N'법령위반',
     N'최근 3년간 법령 위반 현황',
     5,  1.00, 13, 1),

    -- ■ 추가 가산점항목 (배점 합계 10점)
    ('SAFETY_MGT_COST',    N'추가 가산점항목', N'산업안전보건관리비',
     N'산업안전 보건관리비 계정 적용 여부',
     1,  1.00, 14, 1),

    ('SAFETY_REGULATION',  N'추가 가산점항목', N'안전보건관리규정',
     N'안전보건관리 규정 보유/적용 여부',
     1,  1.00, 15, 1),

    ('SAFETY_MGMT_SYS',    N'추가 가산점항목', N'안전보건경영시스템',
     N'ISO 45001 or KOSHA MS 등 인증 여부',
     2,  1.00, 16, 1),

    ('RISK_CERT',          N'추가 가산점항목', N'위험성평가 인증',
     N'위험성평가 우수사업자 인증 여부',
     1,  1.00, 17, 1),

    ('PORT_AGREEMENT',     N'추가 가산점항목', N'항만운영협약',
     N'해수부 항만운영협약 체결 대상자',
     2,  1.00, 18, 1),

    ('DISASTER_REDUCTION', N'추가 가산점항목', N'재해경감우수기업',
     N'재해경감우수기업 인증 여부',
     1,  1.00, 19, 1),

    ('HEALTH_PROMOTION',   N'추가 가산점항목', N'건강증진 우수사업장',
     N'근로자 건강증진활동 우수 사업장 인증 여부',
     1,  1.00, 20, 1),

    ('EXTERNAL_AWARD',     N'추가 가산점항목', N'외부기관 포상',
     N'안전보건 관련 정부협회 포상',
     1,  1.00, 21, 1);
GO

-- 3. 기존 평가 건들에 새 항목 점수 재생성 (더미)
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
            WHEN @status = 'DRAFT'     AND i.sort_order > 5  THEN NULL
            WHEN @status = 'DRAFT'                           THEN CAST(ROUND(i.max_score * 0.70, 0) AS DECIMAL(5,2))
            WHEN @status = 'SUBMITTED'                       THEN CAST(ROUND(i.max_score * 0.80, 0) AS DECIMAL(5,2))
            WHEN @status = 'APPROVED'                        THEN CAST(ROUND(i.max_score * 0.90, 0) AS DECIMAL(5,2))
            WHEN @status = 'REJECTED'
                 AND i.category = N'재해발생 수준'            THEN CAST(ROUND(i.max_score * 0.30, 0) AS DECIMAL(5,2))
            WHEN @status = 'REJECTED'                        THEN CAST(ROUND(i.max_score * 0.55, 0) AS DECIMAL(5,2))
        END AS score,
        CAST(i.max_score AS DECIMAL(5,2)),
        i.weight,
        CASE
            WHEN @status = 'DRAFT' AND i.sort_order > 5 THEN NULL
            ELSE CAST(ROUND(i.max_score * CASE
                WHEN @status = 'DRAFT'                                     THEN 0.70
                WHEN @status = 'SUBMITTED'                                 THEN 0.80
                WHEN @status = 'APPROVED'                                  THEN 0.90
                WHEN @status = 'REJECTED' AND i.category = N'재해발생 수준' THEN 0.30
                WHEN @status = 'REJECTED'                                  THEN 0.55
            END * i.weight, 2) AS DECIMAL(7,2))
        END AS weighted_score,
        NULL
    FROM tb_evaluation_item i
    WHERE i.active = 1 AND i.deleted = 0;

    FETCH NEXT FROM eval_cursor INTO @evalId, @status;
END;

CLOSE eval_cursor;
DEALLOCATE eval_cursor;
GO

-- 4. 평가 집계 재계산
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
            SUM(s.weighted_score) AS total_weighted,
            SUM(s.max_score * s.weight) AS max_weighted
          FROM tb_evaluation_item_score s
         WHERE s.evaluation_id = e.id
           AND s.score IS NOT NULL
 ) agg
 WHERE e.status <> 'DRAFT';
GO
