-- [2026-04-30] 절차서 등재 기능 — tb_procedure_doc 테이블 생성
-- 실행 DB: PANOCEAN_EHS (또는 penocean)
-- 실행 방법: SSMS 또는 sqlcmd 로 직접 실행

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_procedure_doc')
BEGIN
    CREATE TABLE tb_procedure_doc (
        id          BIGINT          IDENTITY(1,1) NOT NULL,
        proc_type   NVARCHAR(50)    NOT NULL,   -- ACCESS_SAFETY | RISK_ASSESSMENT
        file_name   NVARCHAR(255)   NOT NULL,
        file_path   NVARCHAR(500)   NOT NULL,
        file_size   BIGINT          NULL,
        mime_type   NVARCHAR(100)   NULL,
        uploaded_by BIGINT          NULL,
        created_at  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
        deleted     BIT             NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_procedure_doc PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_procedure_doc_uploader FOREIGN KEY (uploaded_by) REFERENCES tb_user(id)
    );

    CREATE INDEX IX_tb_procedure_doc_proc_type ON tb_procedure_doc(proc_type, deleted, created_at DESC);
    PRINT 'tb_procedure_doc 테이블 생성 완료.';
END
ELSE
BEGIN
    PRINT 'tb_procedure_doc 테이블이 이미 존재합니다.';
END
GO
