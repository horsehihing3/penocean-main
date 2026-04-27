-- =====================================================================
-- Phase 7 / V15 : PPT slide 20 요구사항 — 평가 항목별 "자료없음" 체크
-- 자료없음으로 체크된 항목은 점수·만점 모두에서 제외되어 동적으로 총점/만점이
-- 재계산된다. (예: 14항목 × 10점 = 110점 만점에서 1개 NA → 100점 만점)
-- =====================================================================

IF COL_LENGTH('dbo.tb_evaluation_item_score', 'not_applicable') IS NULL
BEGIN
    ALTER TABLE dbo.tb_evaluation_item_score
        ADD not_applicable BIT NOT NULL CONSTRAINT DF_tb_evaluation_item_score_na DEFAULT 0;
END
GO
