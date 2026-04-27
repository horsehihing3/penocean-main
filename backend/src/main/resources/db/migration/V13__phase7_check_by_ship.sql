-- =====================================================================
-- Phase 7 / V13 : PPT slide 15 요구사항 — 방문허가서 작업자별 "Check by ship"
-- 선박에서 승선 체크 시각을 기록하기 위한 컬럼 추가.
-- 방문허가서(Visit Permit) 양식의 Check by ship 컬럼에 노출된다.
-- =====================================================================

IF COL_LENGTH('dbo.tb_access_worker', 'check_by_ship') IS NULL
BEGIN
    ALTER TABLE dbo.tb_access_worker
        ADD check_by_ship BIT NOT NULL CONSTRAINT DF_tb_access_worker_check_by_ship DEFAULT 0;
END
GO

IF COL_LENGTH('dbo.tb_access_worker', 'check_by_ship_at') IS NULL
BEGIN
    ALTER TABLE dbo.tb_access_worker
        ADD check_by_ship_at DATETIME2(3) NULL;
END
GO

IF COL_LENGTH('dbo.tb_access_worker', 'check_by_ship_user_id') IS NULL
BEGIN
    ALTER TABLE dbo.tb_access_worker
        ADD check_by_ship_user_id BIGINT NULL;
END
GO
