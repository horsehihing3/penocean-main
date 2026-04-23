-- =====================================================================
-- V2__seed_code_masters.sql
-- 팬오션 안전보건 DX - 공통 코드 마스터 시드
-- =====================================================================

SET NOCOUNT ON;
GO

-- =========================
-- INDUSTRY : 협력업체 업종
-- =========================
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('INDUSTRY', 'INSPECTION',    N'검수업',        N'화물 검수 (수량/상태 확인)',             10, 1),
    ('INDUSTRY', 'LASHING',       N'고박업',        N'선적 화물 고정/결박 작업',               20, 1),
    ('INDUSTRY', 'STEVEDORING',   N'하역업',        N'화물 선적/하역 작업',                     30, 1),
    ('INDUSTRY', 'SURVEY',        N'검정업',        N'화물/선박 검정 (량/품위)',               40, 1),
    ('INDUSTRY', 'SHIP_SUPPLY',   N'선용품공급업',  N'선박 운항 필수 용품 공급',                50, 1),
    ('INDUSTRY', 'REPAIR',        N'수리업',        N'선박/설비 수리',                          60, 1),
    ('INDUSTRY', 'PAINTING',      N'도장업',        N'선체/구조물 도장',                        70, 1),
    ('INDUSTRY', 'WELDING',       N'용접업',        N'용접/금속 가공',                          80, 1),
    ('INDUSTRY', 'ETC',           N'기타',          N'기타 협력 업종',                          99, 1);
GO

-- =========================
-- VESSEL_TYPE : 선박 유형
-- =========================
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('VESSEL_TYPE', 'BULK',       N'벌크선',          N'건화물 운반선 (석탄/철광석/곡물 등)', 10, 1),
    ('VESSEL_TYPE', 'TANKER',     N'유조선',          N'원유/제품유 운반선',                 20, 1),
    ('VESSEL_TYPE', 'CONTAINER',  N'컨테이너선',      N'컨테이너 전용 운반선',               30, 1),
    ('VESSEL_TYPE', 'LNG',        N'LNG선',           N'액화천연가스 운반선',                40, 1),
    ('VESSEL_TYPE', 'LPG',        N'LPG선',           N'액화석유가스 운반선',                50, 1),
    ('VESSEL_TYPE', 'CAR_CARRIER',N'자동차운반선',    N'PCTC/RO-RO 자동차 운반선',           60, 1),
    ('VESSEL_TYPE', 'ETC',        N'기타',            N'기타 선종',                          99, 1);
GO

-- =========================
-- USER_STATUS : 사용자 상태
-- =========================
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('USER_STATUS', 'PENDING',   N'승인대기', N'가입 신청 후 관리자 승인 대기',      10, 1),
    ('USER_STATUS', 'APPROVED',  N'승인완료', N'사용 가능 상태',                    20, 1),
    ('USER_STATUS', 'REJECTED',  N'반려',     N'가입이 반려됨',                     30, 1),
    ('USER_STATUS', 'INACTIVE',  N'비활성',   N'일시/영구 사용 중지',               40, 1);
GO

-- =========================
-- COMPANY_STATUS : 협력업체 상태
-- =========================
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('COMPANY_STATUS', 'ACTIVE',    N'정상',     N'정상 거래',             10, 1),
    ('COMPANY_STATUS', 'INACTIVE',  N'비활성',   N'일시 중지',             20, 1),
    ('COMPANY_STATUS', 'BLACKLIST', N'블랙리스트', N'거래 제한',           30, 1);
GO

-- =========================
-- NOTIFICATION_CHANNEL
-- =========================
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('NOTIFICATION_CHANNEL', 'EMAIL',  N'이메일',   N'SMTP 이메일',       10, 1),
    ('NOTIFICATION_CHANNEL', 'KAKAO',  N'카카오톡', N'카카오 알림톡',      20, 1),
    ('NOTIFICATION_CHANNEL', 'SYSTEM', N'시스템',   N'포털 내부 알림',     30, 1);
GO

-- =========================
-- VESSEL_STATUS : 선박 운항 상태
-- =========================
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('VESSEL_STATUS', 'IN_SERVICE', N'운항중',      N'정상 운항',         10, 1),
    ('VESSEL_STATUS', 'DRY_DOCK',   N'도크입거',    N'수리/검사 중',       20, 1),
    ('VESSEL_STATUS', 'RETIRED',    N'퇴역',        N'운항 종료',         30, 1);
GO
