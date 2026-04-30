-- [2026-04-30] 절차서 등재 기능 — tb_procedure_doc 테이블 생성
CREATE TABLE tb_procedure_doc (
    id          BIGINT          IDENTITY(1,1) NOT NULL,
    proc_type   NVARCHAR(50)    NOT NULL,
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
