-- =====================================================================
-- Phase 7 / V14 : PPT slide 26 요구사항 — 협력업체 안전보건평가 수정 History
-- 평가 작성/제출/승인/반려 + 개선요청 요청/응답/종결 이력을 기록한다.
-- 기존 tb_audit_log 대신 평가 도메인 전용 테이블로 분리하여 조회/UI 연동을
-- 단순화한다.
-- =====================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_evaluation_history')
BEGIN
    CREATE TABLE dbo.tb_evaluation_history (
        id             BIGINT        IDENTITY(1,1) NOT NULL,
        evaluation_id  BIGINT        NOT NULL,
        improvement_id BIGINT        NULL,              -- 개선요청 관련 이벤트일 때 set
        action         VARCHAR(50)   NOT NULL,           -- CREATE / UPDATE / SUBMIT / APPROVE / REJECT /
                                                         -- IMPROVE_REQUEST / IMPROVE_RESPOND / IMPROVE_CLOSE
        actor_user_id  BIGINT        NULL,
        actor_name     NVARCHAR(100) NULL,
        detail         NVARCHAR(MAX) NULL,
        created_at     DATETIME2(3)  NOT NULL CONSTRAINT DF_tb_evaluation_history_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tb_evaluation_history PRIMARY KEY CLUSTERED (id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_history_eval')
    CREATE INDEX IX_tb_evaluation_history_eval
        ON dbo.tb_evaluation_history(evaluation_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_history_imp')
    CREATE INDEX IX_tb_evaluation_history_imp
        ON dbo.tb_evaluation_history(improvement_id)
        WHERE improvement_id IS NOT NULL;
GO
