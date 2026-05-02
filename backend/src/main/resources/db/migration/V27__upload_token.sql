-- [2026-05-02] 정보수집 비로그인 파일 업로드용 토큰 컬럼 추가
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_NAME = 'tb_access_request' AND COLUMN_NAME = 'upload_token'
)
BEGIN
    ALTER TABLE tb_access_request
        ADD upload_token     VARCHAR(64)  NULL,
            token_expires_at DATETIME2    NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
     WHERE name = 'UQ_tb_access_request_upload_token'
)
BEGIN
    CREATE UNIQUE INDEX UQ_tb_access_request_upload_token
        ON tb_access_request(upload_token)
        WHERE upload_token IS NOT NULL;
END;
GO
