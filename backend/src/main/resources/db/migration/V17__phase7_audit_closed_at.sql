-- =====================================================================
-- Phase 7 / V17 : tb_audit_inspection 에 closed_at 컬럼 보강
-- 원격 DB 에는 이전 스키마가 적용돼 closed_at 이 누락되어 상세 조회 시
-- "열 이름 'closed_at'이(가) 유효하지 않습니다" 에러 발생.
-- =====================================================================

IF COL_LENGTH('dbo.tb_audit_inspection', 'closed_at') IS NULL
BEGIN
    ALTER TABLE dbo.tb_audit_inspection
        ADD closed_at DATETIME2(3) NULL;
END
GO
