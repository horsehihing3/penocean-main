-- V24: QR 이수 기록에 작업자 연결 컬럼 추가
-- [2026-04-27] 이수 완료 시 tb_access_worker 연계 처리 지원

ALTER TABLE tb_safety_qr_record
    ADD worker_id BIGINT NULL REFERENCES tb_access_worker(id);

ALTER TABLE tb_safety_qr_record
    ALTER COLUMN vessel_name NVARCHAR(100) NULL;
