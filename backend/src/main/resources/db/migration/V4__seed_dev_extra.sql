-- =====================================================================
-- V4__seed_dev_extra.sql
-- 개발 프로파일 전용 확장 더미 (감사 로그 등)
-- 프로덕션에서는 실행하지 않도록 Flyway profile 또는 별도 locations 로 분리 가능.
-- =====================================================================

SET NOCOUNT ON;
GO

-- tb_audit_log : 개발 확인용 샘플 이벤트
DECLARE @U_ADMIN BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @U_C1    BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor1');
DECLARE @U_C4    BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor4');

INSERT INTO tb_audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent, request_body) VALUES
    (@U_ADMIN, 'LOGIN',    'USER', @U_ADMIN, '127.0.0.1',   N'Mozilla/5.0 (dev)',  NULL),
    (@U_C4,    'REGISTER', 'USER', @U_C4,    '192.168.0.4', N'Mozilla/5.0 (dev)',  N'{"username":"contractor4"}'),
    (@U_ADMIN, 'APPROVE',  'USER', @U_C1,    '127.0.0.1',   N'Mozilla/5.0 (dev)',  N'{"targetUserId":' + CAST(@U_C1 AS NVARCHAR(20)) + N'}'),
    (@U_C1,    'LOGIN',    'USER', @U_C1,    '192.168.0.1', N'Mozilla/5.0 (dev)',  NULL);
GO
