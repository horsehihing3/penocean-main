-- V23: QR 안전교육 이수 관리 테이블
-- [2026-04-27] QR코드 스캔 기반 안전교육 이수 플로우 추가

CREATE TABLE tb_safety_qr (
    id          BIGINT IDENTITY(1,1) PRIMARY KEY,
    token       VARCHAR(64)       NOT NULL UNIQUE,
    title       NVARCHAR(200)     NOT NULL,
    vessel_name NVARCHAR(100),
    content     NVARCHAR(MAX),
    is_active   BIT               NOT NULL DEFAULT 1,
    created_by  NVARCHAR(100),
    created_at  DATETIME2         NOT NULL DEFAULT GETDATE(),
    expires_at  DATETIME2
);

CREATE TABLE tb_safety_qr_record (
    id           BIGINT IDENTITY(1,1) PRIMARY KEY,
    qr_id        BIGINT        NOT NULL REFERENCES tb_safety_qr(id),
    worker_name  NVARCHAR(100) NOT NULL,
    vessel_name  NVARCHAR(100) NOT NULL,
    work_date    DATE          NOT NULL,
    gender       NVARCHAR(10),
    phone        NVARCHAR(20),
    completed_at DATETIME2     NOT NULL DEFAULT GETDATE()
);

CREATE INDEX IX_safety_qr_record_qr_id ON tb_safety_qr_record(qr_id);
