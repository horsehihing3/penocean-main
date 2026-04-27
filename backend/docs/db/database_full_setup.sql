-- =====================================================================
-- 팬오션 안전보건 DX - 데이터베이스 전체 설정 스크립트
-- database_full_setup.sql
--
-- 이 파일은 다음 내용을 순서대로 포함합니다:
--   [STEP 0] DB / 로그인 / 사용자 생성  (SA 권한 필요, master DB에서 실행)
--   [STEP 1~20] Flyway 마이그레이션 전체 (V1 ~ V20)
--
-- Target     : Microsoft SQL Server 2019+
-- Collation  : Korean_Wansung_CI_AS
-- Migration  : Flyway Community
--
-- ■ 실행 방법 (권장):
--   Spring Boot 기동 or ./gradlew flywayMigrate  → Flyway가 V1~V20 자동 적용
--
-- ■ 수동 sqlcmd 전체 실행 예 (PowerShell):
--   sqlcmd -S localhost -d master -U sa -P <SA_PASS> -i database_full_setup.sql -b
--
-- ■ 계정 정보 (개발용, 운영 전 반드시 교체):
--   App 계정  : panocean_app  / ChangeMe!Now#2026
--   DDL 계정  : panocean_ddl  / ChangeMe!Ddl#2026
--   더미 로그인: 모두 password123  (BCrypt hash 포함)
-- =====================================================================

-- =====================================================================
-- [STEP 0]  DB / 로그인 / 사용자 생성
--           SA 또는 sysadmin 권한으로 master DB에서 실행
-- =====================================================================

USE master;
GO

-- 0-1) DB 생성
IF DB_ID('PANOCEAN_EHS') IS NULL
    CREATE DATABASE PANOCEAN_EHS
        COLLATE Korean_Wansung_CI_AS;
GO

ALTER DATABASE PANOCEAN_EHS SET READ_COMMITTED_SNAPSHOT ON;
ALTER DATABASE PANOCEAN_EHS SET ALLOW_SNAPSHOT_ISOLATION ON;
GO

-- 0-2) 서버 로그인 (런타임용)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'panocean_app')
    CREATE LOGIN panocean_app
        WITH PASSWORD   = 'ChangeMe!Now#2026',
             DEFAULT_DATABASE = PANOCEAN_EHS,
             CHECK_POLICY  = ON;
GO

-- 0-3) DB 사용자 (런타임용)
USE PANOCEAN_EHS;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'panocean_app')
    CREATE USER panocean_app FOR LOGIN panocean_app;
GO

-- 0-4) 최소 권한 (runtime용)
ALTER ROLE db_datareader ADD MEMBER panocean_app;
ALTER ROLE db_datawriter ADD MEMBER panocean_app;
GO

-- 0-5) Flyway 마이그레이션용 DDL 계정
USE master;
GO
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'panocean_ddl')
    CREATE LOGIN panocean_ddl
        WITH PASSWORD = 'ChangeMe!Ddl#2026',
             DEFAULT_DATABASE = PANOCEAN_EHS;
GO

USE PANOCEAN_EHS;
GO
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'panocean_ddl')
    CREATE USER panocean_ddl FOR LOGIN panocean_ddl;
ALTER ROLE db_ddladmin      ADD MEMBER panocean_ddl;
ALTER ROLE db_datareader    ADD MEMBER panocean_ddl;
ALTER ROLE db_datawriter    ADD MEMBER panocean_ddl;
GO

-- 이후부터 PANOCEAN_EHS DB에서 작업
USE PANOCEAN_EHS;
GO


-- =====================================================================
-- [MIGRATION V1]  V1__init_common_schema.sql
-- 팬오션 안전보건 DX - Phase 1 공통 스키마
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- tb_role : 사용자 역할 (ADMIN / CONTRACTOR / CONTRACT_DEPT)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_role')
BEGIN
    CREATE TABLE tb_role (
        id           BIGINT       IDENTITY(1,1) NOT NULL,
        code         VARCHAR(30)  NOT NULL,
        name         NVARCHAR(50) NOT NULL,
        description  NVARCHAR(200) NULL,
        created_at   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at   DATETIME2    NULL,
        deleted      BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_role PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_role_code UNIQUE (code)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'사용자 역할 (ADMIN, CONTRACTOR, CONTRACT_DEPT)', 'SCHEMA', 'dbo', 'TABLE', 'tb_role';
GO

-- tb_code : 공통 코드 마스터 (업종, 선박유형, 상태 등)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_code')
BEGIN
    CREATE TABLE tb_code (
        id           BIGINT       IDENTITY(1,1) NOT NULL,
        group_code   VARCHAR(50)  NOT NULL,
        code         VARCHAR(50)  NOT NULL,
        name         NVARCHAR(100) NOT NULL,
        description  NVARCHAR(500) NULL,
        sort_order   INT          NOT NULL DEFAULT 0,
        active       BIT          NOT NULL DEFAULT 1,
        created_at   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at   DATETIME2    NULL,
        deleted      BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_code PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_code_group_code UNIQUE (group_code, code)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'공통 코드 마스터 (업종/선박유형/상태 등 group_code 로 묶음)', 'SCHEMA', 'dbo', 'TABLE', 'tb_code';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_code_group_active')
    CREATE INDEX IX_tb_code_group_active ON tb_code(group_code, active, sort_order);
GO

-- tb_department : 계약부서 (자기 참조)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_department')
BEGIN
    CREATE TABLE tb_department (
        id              BIGINT       IDENTITY(1,1) NOT NULL,
        code            VARCHAR(30)  NOT NULL,
        name            NVARCHAR(100) NOT NULL,
        parent_id       BIGINT       NULL,
        manager_user_id BIGINT       NULL,
        created_at      DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2    NULL,
        deleted         BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_department PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_department_code UNIQUE (code),
        CONSTRAINT FK_department_parent FOREIGN KEY (parent_id) REFERENCES tb_department(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'계약부서 (조직). parent_id 로 계층 구조.', 'SCHEMA', 'dbo', 'TABLE', 'tb_department';
GO

-- tb_company : 협력업체
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_company')
BEGIN
    CREATE TABLE tb_company (
        id                   BIGINT       IDENTITY(1,1) NOT NULL,
        business_number      VARCHAR(20)  NOT NULL,
        name                 NVARCHAR(200) NOT NULL,
        ceo_name             NVARCHAR(100) NULL,
        address              NVARCHAR(500) NULL,
        phone                VARCHAR(30)  NULL,
        email                VARCHAR(200) NULL,
        industry_code        VARCHAR(30)  NULL,
        status               VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
        contract_start_date  DATE         NULL,
        contract_end_date    DATE         NULL,
        created_at           DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at           DATETIME2    NULL,
        deleted              BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_company PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_company_business_number UNIQUE (business_number)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'협력업체 마스터. business_number 는 SOM 연동 키', 'SCHEMA', 'dbo', 'TABLE', 'tb_company';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_company_industry_status')
    CREATE INDEX IX_tb_company_industry_status ON tb_company(industry_code, status);
GO

-- tb_user : 포털 사용자
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_user')
BEGIN
    CREATE TABLE tb_user (
        id             BIGINT       IDENTITY(1,1) NOT NULL,
        username       VARCHAR(50)  NOT NULL,
        password       VARCHAR(255) NOT NULL,
        name           NVARCHAR(100) NULL,
        email          VARCHAR(200) NULL,
        phone          VARCHAR(30)  NULL,
        role_code      VARCHAR(30)  NOT NULL,
        company_id     BIGINT       NULL,
        department_id  BIGINT       NULL,
        status         VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
        approved_at    DATETIME2    NULL,
        approved_by    BIGINT       NULL,
        last_login_at  DATETIME2    NULL,
        created_at     DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at     DATETIME2    NULL,
        deleted        BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_user PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_user_username UNIQUE (username),
        CONSTRAINT FK_user_role       FOREIGN KEY (role_code)     REFERENCES tb_role(code),
        CONSTRAINT FK_user_company    FOREIGN KEY (company_id)    REFERENCES tb_company(id),
        CONSTRAINT FK_user_department FOREIGN KEY (department_id) REFERENCES tb_department(id),
        CONSTRAINT FK_user_approver   FOREIGN KEY (approved_by)   REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'포털 사용자. ADMIN / CONTRACTOR / CONTRACT_DEPT 3개 role 공용.', 'SCHEMA', 'dbo', 'TABLE', 'tb_user';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_user_email')
    CREATE INDEX IX_tb_user_email         ON tb_user(email);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_user_status_role')
    CREATE INDEX IX_tb_user_status_role   ON tb_user(status, role_code);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_user_company')
    CREATE INDEX IX_tb_user_company       ON tb_user(company_id) WHERE company_id IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_user_department')
    CREATE INDEX IX_tb_user_department    ON tb_user(department_id) WHERE department_id IS NOT NULL;
GO

-- tb_department.manager_user_id FK 추가 (tb_user 생성 이후)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_department_manager')
    ALTER TABLE tb_department
        ADD CONSTRAINT FK_department_manager FOREIGN KEY (manager_user_id) REFERENCES tb_user(id);
GO

-- tb_vessel : 선박 (= 사업장)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_vessel')
BEGIN
    CREATE TABLE tb_vessel (
        id            BIGINT       IDENTITY(1,1) NOT NULL,
        code          VARCHAR(30)  NOT NULL,
        name          NVARCHAR(100) NOT NULL,
        imo_number    VARCHAR(20)  NULL,
        flag          VARCHAR(50)  NULL,
        vessel_type   VARCHAR(50)  NULL,
        dwt           DECIMAL(15,2) NULL,
        status        VARCHAR(20)  NOT NULL DEFAULT 'IN_SERVICE',
        current_port  NVARCHAR(100) NULL,
        created_at    DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at    DATETIME2    NULL,
        deleted       BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_vessel PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_vessel_code UNIQUE (code)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'선박 (= 사업장 단위). IMO 번호는 글로벌 유니크.', 'SCHEMA', 'dbo', 'TABLE', 'tb_vessel';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_vessel_name')
    CREATE INDEX IX_tb_vessel_name        ON tb_vessel(name);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_vessel_imo_number')
    CREATE INDEX IX_tb_vessel_imo_number  ON tb_vessel(imo_number);
GO

-- tb_port : 항구 마스터 (UN/LOCODE)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_port')
BEGIN
    CREATE TABLE tb_port (
        id          BIGINT       IDENTITY(1,1) NOT NULL,
        code        VARCHAR(10)  NOT NULL,
        name        NVARCHAR(100) NOT NULL,
        country     VARCHAR(50)  NULL,
        created_at  DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at  DATETIME2    NULL,
        deleted     BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_port PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_port_code UNIQUE (code)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'항구 마스터. code 는 UN/LOCODE.', 'SCHEMA', 'dbo', 'TABLE', 'tb_port';
GO

-- tb_user_department : 다대다 (user <-> department)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_user_department')
BEGIN
    CREATE TABLE tb_user_department (
        user_id        BIGINT     NOT NULL,
        department_id  BIGINT     NOT NULL,
        created_at     DATETIME2  NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tb_user_department PRIMARY KEY CLUSTERED (user_id, department_id),
        CONSTRAINT FK_user_department_user FOREIGN KEY (user_id)       REFERENCES tb_user(id),
        CONSTRAINT FK_user_department_dept FOREIGN KEY (department_id) REFERENCES tb_department(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'계약부서 담당자 매핑 (1 user N depts).', 'SCHEMA', 'dbo', 'TABLE', 'tb_user_department';
GO

-- tb_user_industry : 다대다 (user <-> industry_code)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_user_industry')
BEGIN
    CREATE TABLE tb_user_industry (
        user_id        BIGINT      NOT NULL,
        industry_code  VARCHAR(30) NOT NULL,
        created_at     DATETIME2   NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tb_user_industry PRIMARY KEY CLUSTERED (user_id, industry_code),
        CONSTRAINT FK_user_industry_user FOREIGN KEY (user_id) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'협력업체 사용자 업종 매핑 (1 user N industries). industry_code 는 tb_code(group_code=''INDUSTRY'')', 'SCHEMA', 'dbo', 'TABLE', 'tb_user_industry';
GO

-- tb_notification : 알림 로그 (EMAIL / KAKAO / SYSTEM)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_notification')
BEGIN
    CREATE TABLE tb_notification (
        id                BIGINT       IDENTITY(1,1) NOT NULL,
        recipient_user_id BIGINT       NOT NULL,
        channel           VARCHAR(20)  NOT NULL,
        subject           NVARCHAR(500) NULL,
        body              NVARCHAR(MAX) NULL,
        status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
        sent_at           DATETIME2    NULL,
        created_at        DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        deleted           BIT          NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_notification PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_notification_user FOREIGN KEY (recipient_user_id) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'알림 발송 로그 (EMAIL/KAKAO/SYSTEM 공용).', 'SCHEMA', 'dbo', 'TABLE', 'tb_notification';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_notification_recipient_status')
    CREATE INDEX IX_tb_notification_recipient_status ON tb_notification(recipient_user_id, status);
GO

-- tb_audit_log : 감사 로그 (로그인, 가입, 승인 등)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_audit_log')
BEGIN
    CREATE TABLE tb_audit_log (
        id             BIGINT        IDENTITY(1,1) NOT NULL,
        user_id        BIGINT        NULL,
        action         VARCHAR(100)  NOT NULL,
        resource_type  VARCHAR(50)   NULL,
        resource_id    BIGINT        NULL,
        ip_address     VARCHAR(50)   NULL,
        user_agent     NVARCHAR(500) NULL,
        request_body   NVARCHAR(MAX) NULL,
        created_at     DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tb_audit_log PRIMARY KEY CLUSTERED (id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'감사 로그 (LOGIN/REGISTER/APPROVE 등). user FK 는 soft link.', 'SCHEMA', 'dbo', 'TABLE', 'tb_audit_log';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_audit_log_user_action')
    CREATE INDEX IX_tb_audit_log_user_action ON tb_audit_log(user_id, action, created_at DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_audit_log_resource')
    CREATE INDEX IX_tb_audit_log_resource    ON tb_audit_log(resource_type, resource_id);
GO


-- =====================================================================
-- [MIGRATION V2]  V2__seed_code_masters.sql
-- 공통 코드 마스터 시드
-- =====================================================================

SET NOCOUNT ON;
GO

-- INDUSTRY : 협력업체 업종
IF NOT EXISTS (SELECT 1 FROM tb_code WHERE group_code = 'INDUSTRY' AND code = 'INSPECTION')
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

-- VESSEL_TYPE : 선박 유형
IF NOT EXISTS (SELECT 1 FROM tb_code WHERE group_code = 'VESSEL_TYPE' AND code = 'BULK')
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

-- USER_STATUS : 사용자 상태
IF NOT EXISTS (SELECT 1 FROM tb_code WHERE group_code = 'USER_STATUS' AND code = 'PENDING')
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('USER_STATUS', 'PENDING',   N'승인대기', N'가입 신청 후 관리자 승인 대기',      10, 1),
    ('USER_STATUS', 'APPROVED',  N'승인완료', N'사용 가능 상태',                    20, 1),
    ('USER_STATUS', 'REJECTED',  N'반려',     N'가입이 반려됨',                     30, 1),
    ('USER_STATUS', 'INACTIVE',  N'비활성',   N'일시/영구 사용 중지',               40, 1);
GO

-- COMPANY_STATUS : 협력업체 상태
IF NOT EXISTS (SELECT 1 FROM tb_code WHERE group_code = 'COMPANY_STATUS' AND code = 'ACTIVE')
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('COMPANY_STATUS', 'ACTIVE',    N'정상',     N'정상 거래',             10, 1),
    ('COMPANY_STATUS', 'INACTIVE',  N'비활성',   N'일시 중지',             20, 1),
    ('COMPANY_STATUS', 'BLACKLIST', N'블랙리스트', N'거래 제한',           30, 1);
GO

-- NOTIFICATION_CHANNEL
IF NOT EXISTS (SELECT 1 FROM tb_code WHERE group_code = 'NOTIFICATION_CHANNEL' AND code = 'EMAIL')
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('NOTIFICATION_CHANNEL', 'EMAIL',  N'이메일',   N'SMTP 이메일',       10, 1),
    ('NOTIFICATION_CHANNEL', 'KAKAO',  N'카카오톡', N'카카오 알림톡',      20, 1),
    ('NOTIFICATION_CHANNEL', 'SYSTEM', N'시스템',   N'포털 내부 알림',     30, 1);
GO

-- VESSEL_STATUS : 선박 운항 상태
IF NOT EXISTS (SELECT 1 FROM tb_code WHERE group_code = 'VESSEL_STATUS' AND code = 'IN_SERVICE')
INSERT INTO tb_code (group_code, code, name, description, sort_order, active)
VALUES
    ('VESSEL_STATUS', 'IN_SERVICE', N'운항중',      N'정상 운항',         10, 1),
    ('VESSEL_STATUS', 'DRY_DOCK',   N'도크입거',    N'수리/검사 중',       20, 1),
    ('VESSEL_STATUS', 'RETIRED',    N'퇴역',        N'운항 종료',         30, 1);
GO


-- =====================================================================
-- [MIGRATION V3]  V3__seed_dummy_data.sql
-- 로그인/화면 검증용 더미 데이터
--
-- 비밀번호: 모두 "password123" (BCrypt hash)
-- ※ 운영 투입 전 반드시 교체할 것.
-- =====================================================================

SET NOCOUNT ON;
GO

-- tb_role
IF NOT EXISTS (SELECT 1 FROM tb_role WHERE code = 'ADMIN')
INSERT INTO tb_role (code, name, description) VALUES
    ('ADMIN',         N'시스템 관리자',  N'안전경영팀 / 포털 운영 관리자'),
    ('CONTRACTOR',    N'협력업체',       N'협력업체 사용자 (검수/고박/하역 등)'),
    ('CONTRACT_DEPT', N'계약부서',       N'협력업체와 계약을 관리하는 내부 부서');
GO

-- tb_department (5개)
IF NOT EXISTS (SELECT 1 FROM tb_department WHERE code = 'SAFETY_MGMT')
INSERT INTO tb_department (code, name, parent_id, manager_user_id) VALUES
    ('SAFETY_MGMT',  N'안전경영팀', NULL, NULL),
    ('PURCHASING',   N'구매팀',     NULL, NULL),
    ('OPERATION',    N'운영팀',     NULL, NULL),
    ('VESSEL_MGMT',  N'선박관리팀', NULL, NULL),
    ('SALES',        N'영업팀',     NULL, NULL);
GO

-- tb_company (10개 협력업체)
IF NOT EXISTS (SELECT 1 FROM tb_company WHERE business_number = '111-11-11111')
INSERT INTO tb_company
    (business_number, name, ceo_name, address, phone, email, industry_code, status, contract_start_date, contract_end_date)
VALUES
    ('111-11-11111', N'대한검수',         N'김검수', N'부산광역시 중구 중앙대로 100',       '051-000-1001', 'info@daehan-inspect.co.kr',  'INSPECTION',   'ACTIVE', '2024-01-01', '2026-12-31'),
    ('222-22-22222', N'서울고박',         N'이고박', N'부산광역시 남구 용호로 200',         '051-000-1002', 'info@seoul-lashing.co.kr',   'LASHING',      'ACTIVE', '2024-03-01', '2026-12-31'),
    ('333-33-33333', N'부산하역',         N'박하역', N'부산광역시 영도구 해양로 300',        '051-000-1003', 'info@busan-steve.co.kr',     'STEVEDORING',  'ACTIVE', '2023-07-01', '2026-06-30'),
    ('444-44-44444', N'오션검정',         N'최검정', N'울산광역시 동구 방어진순환도로 400',  '052-000-1004', 'info@ocean-survey.co.kr',    'SURVEY',       'ACTIVE', '2024-01-01', '2026-12-31'),
    ('555-55-55555', N'한라선용품',       N'정용품', N'부산광역시 중구 광복로 500',          '051-000-1005', 'info@halla-supply.co.kr',    'SHIP_SUPPLY',  'ACTIVE', '2024-05-01', '2026-04-30'),
    ('666-66-66666', N'동방선박수리',     N'강수리', N'경남 거제시 장평로 600',              '055-000-1006', 'info@dongbang-repair.co.kr', 'REPAIR',       'ACTIVE', '2024-02-01', '2026-12-31'),
    ('777-77-77777', N'한빛도장',         N'조도장', N'전남 광양시 광양읍 700',              '061-000-1007', 'info@hanbit-paint.co.kr',    'PAINTING',     'ACTIVE', '2024-04-01', '2026-12-31'),
    ('888-88-88888', N'태양용접',         N'윤용접', N'울산광역시 북구 염포로 800',          '052-000-1008', 'info@taeyang-weld.co.kr',    'WELDING',      'ACTIVE', '2024-06-01', '2026-12-31'),
    ('999-99-99999', N'남해검수',         N'배검수', N'경남 통영시 무전동 900',              '055-000-1009', 'info@namhae-inspect.co.kr',  'INSPECTION',   'INACTIVE', '2023-01-01', '2025-12-31'),
    ('123-45-67890', N'퍼시픽로지스틱스', N'한물류', N'부산광역시 강서구 명지국제신도시 1',  '051-000-1010', 'info@pacific-log.co.kr',     'STEVEDORING',  'ACTIVE', '2024-08-01', '2026-12-31');
GO

-- tb_vessel (8개)
IF NOT EXISTS (SELECT 1 FROM tb_vessel WHERE code = 'PO-V001')
INSERT INTO tb_vessel
    (code, name, imo_number, flag, vessel_type, dwt, status, current_port)
VALUES
    ('PO-V001', N'PAN BONA',       '9876501', 'PANAMA',         'BULK',        180000.00, 'IN_SERVICE', N'부산'),
    ('PO-V002', N'PAN TAEAN',      '9876502', 'MARSHALL IS.',   'BULK',         82000.00, 'IN_SERVICE', N'광양'),
    ('PO-V003', N'PAN VISION',     '9876503', 'SINGAPORE',      'CONTAINER',    68000.00, 'IN_SERVICE', N'싱가포르'),
    ('PO-V004', N'PAN CLIPPER',    '9876504', 'LIBERIA',        'TANKER',      115000.00, 'IN_SERVICE', N'울산'),
    ('PO-V005', N'PAN HARMONY',    '9876505', 'KOREA',          'LNG',          95000.00, 'DRY_DOCK',   N'거제'),
    ('PO-V006', N'PAN PIONEER',    '9876506', 'PANAMA',         'BULK',         63000.00, 'IN_SERVICE', N'상하이'),
    ('PO-V007', N'PAN VICTORY',    '9876507', 'MARSHALL IS.',   'CAR_CARRIER',  21000.00, 'IN_SERVICE', N'요코하마'),
    ('PO-V008', N'PAN DILIGENCE',  '9876508', 'PANAMA',         'LPG',          49000.00, 'IN_SERVICE', N'로테르담');
GO

-- tb_port (10개)
IF NOT EXISTS (SELECT 1 FROM tb_port WHERE code = 'KRPUS')
INSERT INTO tb_port (code, name, country) VALUES
    ('KRPUS', N'부산',       'KR'),
    ('KRICN', N'인천',       'KR'),
    ('KRUSN', N'울산',       'KR'),
    ('KRKAN', N'광양',       'KR'),
    ('KRPTK', N'평택',       'KR'),
    ('SGSIN', N'싱가포르',   'SG'),
    ('CNSHA', N'상하이',     'CN'),
    ('NLRTM', N'로테르담',   'NL'),
    ('USHOU', N'휴스턴',     'US'),
    ('JPYOK', N'요코하마',   'JP');
GO

-- tb_user (admin + contractors + contract dept users)
IF NOT EXISTS (SELECT 1 FROM tb_user WHERE username = 'admin')
BEGIN
DECLARE @BCRYPT VARCHAR(255) = '$2b$10$PC8CUkM4OztXSZItxBkZ6OvYwFV66LTA4pmgNTXVEppEUDvuyJcWu';

DECLARE @DEPT_SAFETY  BIGINT = (SELECT id FROM tb_department WHERE code = 'SAFETY_MGMT');
DECLARE @DEPT_PURCH   BIGINT = (SELECT id FROM tb_department WHERE code = 'PURCHASING');
DECLARE @DEPT_OPER    BIGINT = (SELECT id FROM tb_department WHERE code = 'OPERATION');
DECLARE @DEPT_VESSEL  BIGINT = (SELECT id FROM tb_department WHERE code = 'VESSEL_MGMT');

DECLARE @CO_DAEHAN   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL    BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_OCEAN    BIGINT = (SELECT id FROM tb_company WHERE business_number = '444-44-44444');
DECLARE @CO_HALLA    BIGINT = (SELECT id FROM tb_company WHERE business_number = '555-55-55555');

INSERT INTO tb_user
    (username, password, name, email, phone, role_code, company_id, department_id, status, approved_at)
VALUES
    ('admin',       @BCRYPT, N'시스템관리자',  'admin@panocean.com',    '02-000-0001', 'ADMIN', NULL, @DEPT_SAFETY, 'APPROVED', SYSUTCDATETIME());

INSERT INTO tb_user
    (username, password, name, email, phone, role_code, company_id, department_id, status, approved_at)
VALUES
    ('contractor1', @BCRYPT, N'김대한',  'kim@daehan-inspect.co.kr',   '010-1111-0001', 'CONTRACTOR', @CO_DAEHAN, NULL, 'APPROVED', SYSUTCDATETIME()),
    ('contractor2', @BCRYPT, N'이서울',  'lee@seoul-lashing.co.kr',    '010-1111-0002', 'CONTRACTOR', @CO_SEOUL,  NULL, 'APPROVED', SYSUTCDATETIME()),
    ('contractor3', @BCRYPT, N'박부산',  'park@busan-steve.co.kr',     '010-1111-0003', 'CONTRACTOR', @CO_BUSAN,  NULL, 'APPROVED', SYSUTCDATETIME()),
    ('contractor4', @BCRYPT, N'최오션',  'choi@ocean-survey.co.kr',    '010-1111-0004', 'CONTRACTOR', @CO_OCEAN,  NULL, 'PENDING',  NULL),
    ('contractor5', @BCRYPT, N'정한라',  'jung@halla-supply.co.kr',    '010-1111-0005', 'CONTRACTOR', @CO_HALLA,  NULL, 'PENDING',  NULL);

INSERT INTO tb_user
    (username, password, name, email, phone, role_code, company_id, department_id, status, approved_at)
VALUES
    ('contract1',   @BCRYPT, N'윤구매',  'yoon@panocean.com',  '02-000-0002', 'CONTRACT_DEPT', NULL, @DEPT_PURCH,  'APPROVED', SYSUTCDATETIME()),
    ('contract2',   @BCRYPT, N'한운영',  'han@panocean.com',   '02-000-0003', 'CONTRACT_DEPT', NULL, @DEPT_OPER,   'APPROVED', SYSUTCDATETIME()),
    ('contract3',   @BCRYPT, N'서선박',  'seo@panocean.com',   '02-000-0004', 'CONTRACT_DEPT', NULL, @DEPT_VESSEL, 'APPROVED', SYSUTCDATETIME());

DECLARE @ADMIN_ID BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
UPDATE tb_user SET approved_by = @ADMIN_ID WHERE status = 'APPROVED' AND username <> 'admin';
END;
GO

-- tb_department.manager_user_id 보강
UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'admin')
 WHERE code = 'SAFETY_MGMT' AND manager_user_id IS NULL;

UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'contract1')
 WHERE code = 'PURCHASING' AND manager_user_id IS NULL;

UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'contract2')
 WHERE code = 'OPERATION' AND manager_user_id IS NULL;

UPDATE tb_department
   SET manager_user_id = (SELECT id FROM tb_user WHERE username = 'contract3')
 WHERE code = 'VESSEL_MGMT' AND manager_user_id IS NULL;
GO

-- tb_user_department (다대다 샘플)
IF NOT EXISTS (SELECT 1 FROM tb_user_department)
INSERT INTO tb_user_department (user_id, department_id)
SELECT u.id, d.id FROM tb_user u, tb_department d
WHERE (u.username = 'contract1' AND d.code IN ('PURCHASING','SALES'))
   OR (u.username = 'contract2' AND d.code IN ('OPERATION'))
   OR (u.username = 'contract3' AND d.code IN ('VESSEL_MGMT','OPERATION'));
GO

-- tb_user_industry (다대다 샘플)
IF NOT EXISTS (SELECT 1 FROM tb_user_industry)
INSERT INTO tb_user_industry (user_id, industry_code)
SELECT u.id, v.ic FROM tb_user u
CROSS APPLY (VALUES
    ('contractor1','INSPECTION'),
    ('contractor1','SURVEY'),
    ('contractor2','LASHING'),
    ('contractor3','STEVEDORING'),
    ('contractor3','LASHING'),
    ('contractor4','SURVEY'),
    ('contractor5','SHIP_SUPPLY')
) v(un, ic)
WHERE u.username = v.un;
GO

-- tb_notification (5건)
IF NOT EXISTS (SELECT 1 FROM tb_notification)
BEGIN
DECLARE @U_ADMIN   BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @U_C1      BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor1');
DECLARE @U_C4      BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor4');
DECLARE @U_CT1     BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');

INSERT INTO tb_notification (recipient_user_id, channel, subject, body, status, sent_at) VALUES
    (@U_ADMIN, 'SYSTEM', N'신규 가입 승인 요청',  N'contractor4 님이 가입 승인을 요청했습니다.', 'SENT',    SYSUTCDATETIME()),
    (@U_ADMIN, 'SYSTEM', N'신규 가입 승인 요청',  N'contractor5 님이 가입 승인을 요청했습니다.', 'SENT',    SYSUTCDATETIME()),
    (@U_C1,    'EMAIL',  N'[팬오션] 가입 승인',    N'귀하의 포털 가입이 승인되었습니다.',        'SENT',    SYSUTCDATETIME()),
    (@U_C4,    'EMAIL',  N'[팬오션] 가입 접수',    N'가입 신청이 접수되어 관리자 승인 대기중입니다.', 'PENDING', NULL),
    (@U_CT1,   'KAKAO',  N'[팬오션] 신규 협력업체', N'신규 협력업체(한라선용품) 등록이 완료되었습니다.', 'SENT', SYSUTCDATETIME());
END;
GO


-- =====================================================================
-- [MIGRATION V4]  V4__seed_dev_extra.sql
-- 개발 프로파일 전용 확장 더미 (감사 로그)
-- 프로덕션에서는 이 섹션을 실행하지 않는 것을 권장.
-- =====================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM tb_audit_log)
BEGIN
DECLARE @U_ADMIN BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @U_C1    BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor1');
DECLARE @U_C4    BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor4');

INSERT INTO tb_audit_log (user_id, action, resource_type, resource_id, ip_address, user_agent, request_body) VALUES
    (@U_ADMIN, 'LOGIN',    'USER', @U_ADMIN, '127.0.0.1',   N'Mozilla/5.0 (dev)',  NULL),
    (@U_C4,    'REGISTER', 'USER', @U_C4,    '192.168.0.4', N'Mozilla/5.0 (dev)',  N'{"username":"contractor4"}'),
    (@U_ADMIN, 'APPROVE',  'USER', @U_C1,    '127.0.0.1',   N'Mozilla/5.0 (dev)',  N'{"targetUserId":' + CAST(@U_C1 AS NVARCHAR(20)) + N'}'),
    (@U_C1,    'LOGIN',    'USER', @U_C1,    '192.168.0.1', N'Mozilla/5.0 (dev)',  NULL);
END;
GO


-- =====================================================================
-- [MIGRATION V5]  V5__phase3_vessel_access.sql
-- Phase 3 사업장(선박) 출입관리 / Visit Permit / 첨부
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- tb_access_request : 사업장(선박) 출입신청
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_access_request')
BEGIN
    CREATE TABLE tb_access_request (
        id                           BIGINT        IDENTITY(1,1) NOT NULL,
        request_no                   VARCHAR(30)   NOT NULL,
        company_id                   BIGINT        NOT NULL,
        vessel_id                    BIGINT        NOT NULL,
        port_id                      BIGINT        NULL,
        work_type                    NVARCHAR(100) NOT NULL,
        work_description             NVARCHAR(1000) NULL,
        planned_start_date           DATE          NOT NULL,
        planned_end_date             DATE          NOT NULL,
        worker_count                 INT           NOT NULL DEFAULT 0,
        status                       VARCHAR(30)   NOT NULL DEFAULT 'DRAFT',
        submitted_by                 BIGINT        NULL,
        submitted_at                 DATETIME2     NULL,
        reviewed_by                  BIGINT        NULL,
        reviewed_at                  DATETIME2     NULL,
        improvement_request_reason   NVARCHAR(1000) NULL,
        created_at                   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at                   DATETIME2     NULL,
        deleted                      BIT           NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_access_request PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_access_request_request_no UNIQUE (request_no),
        CONSTRAINT FK_access_request_company   FOREIGN KEY (company_id)   REFERENCES tb_company(id),
        CONSTRAINT FK_access_request_vessel    FOREIGN KEY (vessel_id)    REFERENCES tb_vessel(id),
        CONSTRAINT FK_access_request_port      FOREIGN KEY (port_id)      REFERENCES tb_port(id),
        CONSTRAINT FK_access_request_submitter FOREIGN KEY (submitted_by) REFERENCES tb_user(id),
        CONSTRAINT FK_access_request_reviewer  FOREIGN KEY (reviewed_by)  REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'사업장(선박) 출입신청. request_no 포맷: AR-YYYYMMDD-NNNN', 'SCHEMA', 'dbo', 'TABLE', 'tb_access_request';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_access_request_status_submitted')
    CREATE INDEX IX_tb_access_request_status_submitted ON tb_access_request(status, submitted_at DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_access_request_company')
    CREATE INDEX IX_tb_access_request_company          ON tb_access_request(company_id);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_access_request_vessel')
    CREATE INDEX IX_tb_access_request_vessel           ON tb_access_request(vessel_id);
GO

-- tb_access_worker : 출입신청 작업자 리스트
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_access_worker')
BEGIN
    CREATE TABLE tb_access_worker (
        id                            BIGINT        IDENTITY(1,1) NOT NULL,
        access_request_id             BIGINT        NOT NULL,
        worker_name                   NVARCHAR(100) NOT NULL,
        worker_birth                  DATE          NULL,
        worker_phone                  VARCHAR(30)   NULL,
        worker_role                   NVARCHAR(100) NULL,
        safety_edu_completed          BIT           NOT NULL DEFAULT 0,
        safety_edu_completed_at       DATETIME2     NULL,
        safety_edu_certificate_url    NVARCHAR(500) NULL,
        created_at                    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at                    DATETIME2     NULL,
        deleted                       BIT           NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_access_worker PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_access_worker_request FOREIGN KEY (access_request_id)
            REFERENCES tb_access_request(id) ON DELETE CASCADE
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'출입신청에 등록된 작업자 리스트. 안전교육 이수 여부 포함.', 'SCHEMA', 'dbo', 'TABLE', 'tb_access_worker';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_access_worker_request')
    CREATE INDEX IX_tb_access_worker_request ON tb_access_worker(access_request_id);
GO

-- tb_access_attachment : 출입신청 첨부파일
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_access_attachment')
BEGIN
    CREATE TABLE tb_access_attachment (
        id                  BIGINT        IDENTITY(1,1) NOT NULL,
        access_request_id   BIGINT        NOT NULL,
        attachment_type     VARCHAR(30)   NOT NULL,
        file_name           NVARCHAR(500) NOT NULL,
        file_path           NVARCHAR(1000) NOT NULL,
        file_size           BIGINT        NULL,
        mime_type           VARCHAR(100)  NULL,
        uploaded_by         BIGINT        NULL,
        uploaded_at         DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        deleted             BIT           NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_access_attachment PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_access_attachment_request FOREIGN KEY (access_request_id)
            REFERENCES tb_access_request(id) ON DELETE CASCADE,
        CONSTRAINT FK_access_attachment_uploader FOREIGN KEY (uploaded_by) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'출입신청 첨부파일. attachment_type=RISK_ASSESSMENT/PLEDGE/WORK_PLAN/OTHER', 'SCHEMA', 'dbo', 'TABLE', 'tb_access_attachment';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_access_attachment_request_type')
    CREATE INDEX IX_tb_access_attachment_request_type ON tb_access_attachment(access_request_id, attachment_type);
GO

-- tb_visit_permit : Visit Permit (자동 발급)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_visit_permit')
BEGIN
    CREATE TABLE tb_visit_permit (
        id                  BIGINT        IDENTITY(1,1) NOT NULL,
        permit_no           VARCHAR(30)   NOT NULL,
        access_request_id   BIGINT        NOT NULL,
        vessel_id           BIGINT        NOT NULL,
        company_id          BIGINT        NOT NULL,
        valid_from          DATETIME2     NOT NULL,
        valid_to            DATETIME2     NOT NULL,
        qr_code_url         NVARCHAR(500) NULL,
        issued_by           BIGINT        NULL,
        issued_at           DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        revoked             BIT           NOT NULL DEFAULT 0,
        revoked_reason      NVARCHAR(500) NULL,
        revoked_at          DATETIME2     NULL,
        created_at          DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2     NULL,
        deleted             BIT           NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_visit_permit PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_visit_permit_permit_no UNIQUE (permit_no),
        CONSTRAINT FK_visit_permit_request FOREIGN KEY (access_request_id) REFERENCES tb_access_request(id),
        CONSTRAINT FK_visit_permit_vessel  FOREIGN KEY (vessel_id)         REFERENCES tb_vessel(id),
        CONSTRAINT FK_visit_permit_company FOREIGN KEY (company_id)        REFERENCES tb_company(id),
        CONSTRAINT FK_visit_permit_issuer  FOREIGN KEY (issued_by)         REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'Visit Permit. 출입신청 APPROVED 시 자동 발급.', 'SCHEMA', 'dbo', 'TABLE', 'tb_visit_permit';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_visit_permit_permit_no')
    CREATE INDEX IX_tb_visit_permit_permit_no         ON tb_visit_permit(permit_no);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_visit_permit_vessel_valid_from')
    CREATE INDEX IX_tb_visit_permit_vessel_valid_from ON tb_visit_permit(vessel_id, valid_from DESC);
GO

-- tb_access_review_log : 서류 검토 진행 로그
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_access_review_log')
BEGIN
    CREATE TABLE tb_access_review_log (
        id                  BIGINT         IDENTITY(1,1) NOT NULL,
        access_request_id   BIGINT         NOT NULL,
        action              VARCHAR(50)    NOT NULL,
        comment             NVARCHAR(1000) NULL,
        actor_user_id       BIGINT         NULL,
        acted_at            DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        created_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tb_access_review_log PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_access_review_log_request FOREIGN KEY (access_request_id)
            REFERENCES tb_access_request(id) ON DELETE CASCADE,
        CONSTRAINT FK_access_review_log_actor FOREIGN KEY (actor_user_id) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'출입신청 서류 검토 진행 로그 (검토중/개선요청/검토완료).', 'SCHEMA', 'dbo', 'TABLE', 'tb_access_review_log';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_access_review_log_request')
    CREATE INDEX IX_tb_access_review_log_request ON tb_access_review_log(access_request_id, acted_at DESC);
GO

-- tb_daily_safety_log : 승선대표자 일일안전교육일지
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_daily_safety_log')
BEGIN
    CREATE TABLE tb_daily_safety_log (
        id                  BIGINT         IDENTITY(1,1) NOT NULL,
        vessel_id           BIGINT         NOT NULL,
        company_id          BIGINT         NULL,
        log_date            DATE           NOT NULL,
        representative_name NVARCHAR(100)  NULL,
        attendees_count     INT            NOT NULL DEFAULT 0,
        training_content    NVARCHAR(2000) NULL,
        scanned_file_url    NVARCHAR(500)  NULL,
        kakao_message_id    VARCHAR(100)   NULL,
        received_via        VARCHAR(20)    NOT NULL DEFAULT 'UPLOAD',
        created_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2      NULL,
        deleted             BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_daily_safety_log PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_daily_safety_log_vessel  FOREIGN KEY (vessel_id)  REFERENCES tb_vessel(id),
        CONSTRAINT FK_daily_safety_log_company FOREIGN KEY (company_id) REFERENCES tb_company(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'승선대표자 일일안전교육일지. 스캔/카톡/이메일로 수집.', 'SCHEMA', 'dbo', 'TABLE', 'tb_daily_safety_log';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_daily_safety_log_vessel_date')
    CREATE INDEX IX_tb_daily_safety_log_vessel_date ON tb_daily_safety_log(vessel_id, log_date DESC);
GO


-- =====================================================================
-- [MIGRATION V6]  V6__phase3_seed_dummy.sql
-- Phase 3 화면 검증용 더미 데이터
-- =====================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM tb_access_request WHERE request_no = 'AR-20260401-0001')
BEGIN
DECLARE @U_ADMIN   BIGINT = (SELECT id FROM tb_user   WHERE username = 'admin');
DECLARE @U_C1      BIGINT = (SELECT id FROM tb_user   WHERE username = 'contractor1');
DECLARE @U_C2      BIGINT = (SELECT id FROM tb_user   WHERE username = 'contractor2');
DECLARE @U_C3      BIGINT = (SELECT id FROM tb_user   WHERE username = 'contractor3');
DECLARE @U_CT2     BIGINT = (SELECT id FROM tb_user   WHERE username = 'contract2');
DECLARE @U_CT3     BIGINT = (SELECT id FROM tb_user   WHERE username = 'contract3');

DECLARE @CO_DAEHAN BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL  BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN  BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');

DECLARE @V_BONA    BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_TAEAN   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V002');
DECLARE @V_VISION  BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V003');

DECLARE @P_PUS     BIGINT = (SELECT id FROM tb_port    WHERE code = 'KRPUS');
DECLARE @P_KAN     BIGINT = (SELECT id FROM tb_port    WHERE code = 'KRKAN');
DECLARE @P_USN     BIGINT = (SELECT id FROM tb_port    WHERE code = 'KRUSN');

INSERT INTO tb_access_request
    (request_no, company_id, vessel_id, port_id, work_type, work_description,
     planned_start_date, planned_end_date, worker_count,
     status, submitted_by, submitted_at, reviewed_by, reviewed_at, improvement_request_reason, created_at)
VALUES
    ('AR-20260401-0001', @CO_DAEHAN, @V_BONA,   @P_PUS, N'화물검수', N'부산항 정박 중 화물 검수 작업 (contractor1 작성 중)',
     '2026-04-20', '2026-04-22', 3, 'DRAFT', @U_C1, NULL, NULL, NULL, NULL, DATEADD(day, -2,  SYSUTCDATETIME())),
    ('AR-20260405-0002', @CO_SEOUL,  @V_TAEAN,  @P_KAN, N'고박작업', N'광양항 컨테이너 고박 작업',
     '2026-04-22', '2026-04-23', 5, 'SUBMITTED', @U_C2, DATEADD(day, -5, SYSUTCDATETIME()), NULL, NULL, NULL, DATEADD(day, -6,  SYSUTCDATETIME())),
    ('AR-20260406-0003', @CO_BUSAN,  @V_VISION, @P_PUS, N'하역작업', N'부산신항 하역 작업 - 컨테이너 200박스',
     '2026-04-24', '2026-04-26', 8, 'SUBMITTED', @U_C3, DATEADD(day, -4, SYSUTCDATETIME()), NULL, NULL, NULL, DATEADD(day, -5,  SYSUTCDATETIME())),
    ('AR-20260408-0004', @CO_DAEHAN, @V_TAEAN,  @P_USN, N'선박도장', N'울산항 선체 부분도장 (방청작업 포함)',
     '2026-04-25', '2026-04-30', 6, 'IN_REVIEW', @U_C1, DATEADD(day, -7, SYSUTCDATETIME()), @U_CT2, DATEADD(day, -2, SYSUTCDATETIME()), NULL, DATEADD(day, -8,  SYSUTCDATETIME())),
    ('AR-20260410-0005', @CO_SEOUL,  @V_BONA,   @P_PUS, N'고박점검', N'출항 전 고박 상태 점검 및 재고박',
     '2026-04-21', '2026-04-21', 4, 'IMPROVEMENT_REQUESTED', @U_C2, DATEADD(day, -10, SYSUTCDATETIME()), @U_CT2, DATEADD(day, -3, SYSUTCDATETIME()),
     N'위험성평가서 내 추락 위험 평가 누락. 작업계획서에 안전모 미기재. 보완 후 재제출 바랍니다.', DATEADD(day, -11, SYSUTCDATETIME())),
    ('AR-20260412-0006', @CO_BUSAN,  @V_VISION, @P_PUS, N'화물검수', N'부산항 벌크화물 검수 (완료된 건)',
     '2026-04-18', '2026-04-20', 3, 'APPROVED', @U_C3, DATEADD(day, -9, SYSUTCDATETIME()), @U_CT3, DATEADD(day, -1, SYSUTCDATETIME()), NULL, DATEADD(day, -10, SYSUTCDATETIME()));
END;
GO

-- tb_access_worker
IF NOT EXISTS (SELECT 1 FROM tb_access_worker)
BEGIN
DECLARE @AR1 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260401-0001');
DECLARE @AR2 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260405-0002');
DECLARE @AR3 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260406-0003');
DECLARE @AR4 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260408-0004');
DECLARE @AR5 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260410-0005');
DECLARE @AR6 BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260412-0006');

INSERT INTO tb_access_worker (access_request_id, worker_name, worker_birth, worker_phone, worker_role, safety_edu_completed, safety_edu_completed_at, safety_edu_certificate_url) VALUES
    (@AR1, N'김현장',  '1980-03-15', '010-2000-0001', N'현장팀장', 1, DATEADD(day, -20, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0001.pdf'),
    (@AR1, N'박작업',  '1985-07-22', '010-2000-0002', N'작업자',   1, DATEADD(day, -18, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0002.pdf'),
    (@AR1, N'이신입',  '1995-11-01', '010-2000-0003', N'작업자',   0, NULL, NULL),
    (@AR2, N'이고박',  '1978-05-10', '010-2000-0101', N'현장팀장', 1, DATEADD(day, -30, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0101.pdf'),
    (@AR2, N'서고박',  '1982-02-18', '010-2000-0102', N'작업자',   1, DATEADD(day, -25, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0102.pdf'),
    (@AR2, N'정고박',  '1990-09-03', '010-2000-0103', N'작업자',   1, DATEADD(day, -22, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0103.pdf'),
    (@AR2, N'한고박',  '1993-12-25', '010-2000-0104', N'작업자',   0, NULL, NULL),
    (@AR2, N'노고박',  '1996-04-07', '010-2000-0105', N'작업자',   1, DATEADD(day, -10, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0105.pdf'),
    (@AR3, N'박하역',  '1975-08-12', '010-2000-0201', N'현장팀장', 1, DATEADD(day, -40, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0201.pdf'),
    (@AR3, N'조하역',  '1988-06-14', '010-2000-0202', N'작업자',   1, DATEADD(day, -15, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0202.pdf'),
    (@AR3, N'최하역',  '1992-01-20', '010-2000-0203', N'작업자',   0, NULL, NULL),
    (@AR3, N'윤하역',  '1991-10-30', '010-2000-0204', N'작업자',   1, DATEADD(day, -12, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0204.pdf'),
    (@AR4, N'김도장',  '1979-02-02', '010-2000-0301', N'현장팀장', 1, DATEADD(day, -29, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0301.pdf'),
    (@AR4, N'송도장',  '1983-04-04', '010-2000-0302', N'작업자',   1, DATEADD(day, -28, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0302.pdf'),
    (@AR4, N'전도장',  '1987-06-06', '010-2000-0303', N'작업자',   1, DATEADD(day, -27, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0303.pdf'),
    (@AR4, N'강도장',  '1990-08-08', '010-2000-0304', N'작업자',   1, DATEADD(day, -26, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0304.pdf'),
    (@AR4, N'남도장',  '1994-10-10', '010-2000-0305', N'작업자',   1, DATEADD(day, -24, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0305.pdf'),
    (@AR5, N'오고박',  '1981-11-11', '010-2000-0401', N'현장팀장', 1, DATEADD(day, -35, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0401.pdf'),
    (@AR5, N'신고박',  '1986-03-03', '010-2000-0402', N'작업자',   1, DATEADD(day, -17, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0402.pdf'),
    (@AR5, N'문고박',  '1992-05-05', '010-2000-0403', N'작업자',   0, NULL, NULL),
    (@AR5, N'황고박',  '1997-07-07', '010-2000-0404', N'작업자',   0, NULL, NULL),
    (@AR6, N'류검수',  '1976-12-01', '010-2000-0501', N'현장팀장', 1, DATEADD(day, -45, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0501.pdf'),
    (@AR6, N'배검수',  '1984-02-14', '010-2000-0502', N'작업자',   1, DATEADD(day, -44, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0502.pdf'),
    (@AR6, N'안검수',  '1989-09-19', '010-2000-0503', N'작업자',   1, DATEADD(day, -40, SYSUTCDATETIME()), '/uploads/dummy/edu/cert-0503.pdf');
END;
GO

-- tb_access_attachment
IF NOT EXISTS (SELECT 1 FROM tb_access_attachment)
BEGIN
DECLARE @U_C1_A  BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor1');
DECLARE @U_C2_A  BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor2');
DECLARE @U_C3_A  BIGINT = (SELECT id FROM tb_user WHERE username = 'contractor3');

INSERT INTO tb_access_attachment
    (access_request_id, attachment_type, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at)
SELECT ar.id, v.atype, v.fname, v.fpath, v.fsize, v.mime, v.uid, DATEADD(day, v.offset_day, SYSUTCDATETIME())
FROM tb_access_request ar
CROSS APPLY (VALUES
    ('AR-20260401-0001', 'RISK_ASSESSMENT', N'위험성평가서_AR0001.pdf', '/uploads/dummy/ar-0001/risk.pdf',      245678, 'application/pdf', @U_C1_A, -2),
    ('AR-20260401-0001', 'WORK_PLAN',       N'작업계획서_AR0001.pdf',   '/uploads/dummy/ar-0001/workplan.pdf', 189234, 'application/pdf', @U_C1_A, -2),
    ('AR-20260405-0002', 'RISK_ASSESSMENT', N'위험성평가서_AR0002.pdf', '/uploads/dummy/ar-0002/risk.pdf',      301122, 'application/pdf', @U_C2_A, -5),
    ('AR-20260405-0002', 'WORK_PLAN',       N'작업계획서_AR0002.pdf',   '/uploads/dummy/ar-0002/workplan.pdf', 210998, 'application/pdf', @U_C2_A, -5),
    ('AR-20260406-0003', 'RISK_ASSESSMENT', N'위험성평가서_AR0003.pdf', '/uploads/dummy/ar-0003/risk.pdf',      278500, 'application/pdf', @U_C3_A, -4),
    ('AR-20260406-0003', 'WORK_PLAN',       N'작업계획서_AR0003.pdf',   '/uploads/dummy/ar-0003/workplan.pdf', 198776, 'application/pdf', @U_C3_A, -4),
    ('AR-20260408-0004', 'RISK_ASSESSMENT', N'위험성평가서_AR0004.pdf', '/uploads/dummy/ar-0004/risk.pdf',      332110, 'application/pdf', @U_C1_A, -7),
    ('AR-20260408-0004', 'WORK_PLAN',       N'작업계획서_AR0004.pdf',   '/uploads/dummy/ar-0004/workplan.pdf', 220330, 'application/pdf', @U_C1_A, -7),
    ('AR-20260410-0005', 'RISK_ASSESSMENT', N'위험성평가서_AR0005.pdf', '/uploads/dummy/ar-0005/risk.pdf',      256660, 'application/pdf', @U_C2_A, -10),
    ('AR-20260410-0005', 'WORK_PLAN',       N'작업계획서_AR0005.pdf',   '/uploads/dummy/ar-0005/workplan.pdf', 174882, 'application/pdf', @U_C2_A, -10),
    ('AR-20260412-0006', 'RISK_ASSESSMENT', N'위험성평가서_AR0006.pdf', '/uploads/dummy/ar-0006/risk.pdf',      289900, 'application/pdf', @U_C3_A, -9),
    ('AR-20260412-0006', 'WORK_PLAN',       N'작업계획서_AR0006.pdf',   '/uploads/dummy/ar-0006/workplan.pdf', 205110, 'application/pdf', @U_C3_A, -9)
) v(req_no, atype, fname, fpath, fsize, mime, uid, offset_day)
WHERE ar.request_no = v.req_no;
END;
GO

-- tb_visit_permit
IF NOT EXISTS (SELECT 1 FROM tb_visit_permit WHERE permit_no = 'VP-20260101-0001')
BEGIN
DECLARE @AR6_VP  BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260412-0006');
DECLARE @V_VISION_VP BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V003');
DECLARE @CO_BUSAN_VP BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @U_CT3_VP    BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract3');

INSERT INTO tb_visit_permit (permit_no, access_request_id, vessel_id, company_id, valid_from, valid_to, qr_code_url, issued_by, issued_at, revoked)
VALUES ('VP-20260101-0001', @AR6_VP, @V_VISION_VP, @CO_BUSAN_VP,
        '2026-04-18 00:00:00', '2026-04-20 23:59:59',
        '/uploads/dummy/qr/vp-20260101-0001.png',
        @U_CT3_VP, DATEADD(day, -1, SYSUTCDATETIME()), 0);
END;
GO

-- tb_access_review_log
IF NOT EXISTS (SELECT 1 FROM tb_access_review_log)
BEGIN
DECLARE @AR4_RL BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260408-0004');
DECLARE @AR5_RL BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260410-0005');
DECLARE @AR6_RL BIGINT = (SELECT id FROM tb_access_request WHERE request_no = 'AR-20260412-0006');
DECLARE @U_CT2_RL BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');
DECLARE @U_CT3_RL BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');

INSERT INTO tb_access_review_log (access_request_id, action, comment, actor_user_id, acted_at)
VALUES
    (@AR4_RL, 'REVIEW_START', N'서류 검토 시작', @U_CT2_RL, DATEADD(day, -3, SYSUTCDATETIME())),
    (@AR5_RL, 'REVIEW_START',        N'서류 검토 시작', @U_CT2_RL, DATEADD(day, -6, SYSUTCDATETIME())),
    (@AR5_RL, 'IMPROVEMENT_REQUEST', N'위험성평가 누락, 작업계획서 안전모 미기재', @U_CT2_RL, DATEADD(day, -3, SYSUTCDATETIME())),
    (@AR6_RL, 'REVIEW_START', N'서류 검토 시작', @U_CT3_RL, DATEADD(day, -5, SYSUTCDATETIME())),
    (@AR6_RL, 'APPROVE', N'서류 검토 완료. 위험성평가/작업계획서 이상 없음.', @U_CT3_RL, DATEADD(day, -1, SYSUTCDATETIME()));
END;
GO

-- tb_daily_safety_log
IF NOT EXISTS (SELECT 1 FROM tb_daily_safety_log)
BEGIN
DECLARE @V_BONA_DSL    BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_TAEAN_DSL   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V002');
DECLARE @CO_DAEHAN_DSL BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL_DSL  BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');

INSERT INTO tb_daily_safety_log (vessel_id, company_id, log_date, representative_name, attendees_count, training_content, scanned_file_url, kakao_message_id, received_via, created_at)
VALUES
    (@V_BONA_DSL, @CO_DAEHAN_DSL, '2026-04-15', N'김대표',  8, N'협소공간 작업 안전수칙 / 추락방지 / 호흡보호구 착용 교육',
     '/uploads/dummy/safety/bona-20260415.pdf', 'KMSG-20260415-001', 'KAKAO', DATEADD(day, -3, SYSUTCDATETIME())),
    (@V_BONA_DSL, @CO_DAEHAN_DSL, '2026-04-16', N'김대표',  9, N'위험물 취급 절차 / MSDS 확인 / 개인보호구 점검',
     '/uploads/dummy/safety/bona-20260416.pdf', NULL, 'EMAIL', DATEADD(day, -2, SYSUTCDATETIME())),
    (@V_BONA_DSL, @CO_DAEHAN_DSL, '2026-04-17', N'박부대표', 7, N'선상 고소작업 / 안전대 체결 확인 / 작업허가서 숙지',
     '/uploads/dummy/safety/bona-20260417.pdf', NULL, 'UPLOAD', DATEADD(day, -1, SYSUTCDATETIME())),
    (@V_TAEAN_DSL, @CO_SEOUL_DSL, '2026-04-14', N'이대표',  5, N'고박작업 안전수칙 / 중량물 취급 / 수신호',
     '/uploads/dummy/safety/taean-20260414.pdf', 'KMSG-20260414-002', 'KAKAO', DATEADD(day, -4, SYSUTCDATETIME())),
    (@V_TAEAN_DSL, @CO_SEOUL_DSL, '2026-04-16', N'이대표',  6, N'작업 전 TBM / 기상조건 확인 / 비상대응 절차',
     '/uploads/dummy/safety/taean-20260416.pdf', NULL, 'UPLOAD', DATEADD(day, -2, SYSUTCDATETIME()));
END;
GO


-- =====================================================================
-- [MIGRATION V7]  V7__phase4_evaluation_schema.sql
-- Phase 4 협력업체 평가(14항목) / 개선요청 이력 / SOM 스냅샷
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- tb_evaluation_item : 협력업체 안전보건 평가 항목 마스터
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_evaluation_item')
BEGIN
    CREATE TABLE tb_evaluation_item (
        id           BIGINT         IDENTITY(1,1) NOT NULL,
        code         VARCHAR(30)    NOT NULL,
        category     NVARCHAR(50)   NOT NULL,
        title        NVARCHAR(200)  NOT NULL,
        description  NVARCHAR(1000) NULL,
        max_score    INT            NOT NULL DEFAULT 10,
        weight       DECIMAL(5,2)   NOT NULL DEFAULT 1.00,
        sort_order   INT            NOT NULL DEFAULT 0,
        active       BIT            NOT NULL DEFAULT 1,
        created_at   DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at   DATETIME2      NULL,
        deleted      BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_evaluation_item PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_evaluation_item_code UNIQUE (code)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'협력업체 평가 항목 마스터 (14항목). 관리자 편집 가능.', 'SCHEMA', 'dbo', 'TABLE', 'tb_evaluation_item';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_item_category_sort_active')
    CREATE INDEX IX_tb_evaluation_item_category_sort_active ON tb_evaluation_item(category, sort_order, active);
GO

-- tb_evaluation : 평가 헤더
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_evaluation')
BEGIN
    CREATE TABLE tb_evaluation (
        id                      BIGINT         IDENTITY(1,1) NOT NULL,
        evaluation_no           VARCHAR(30)    NOT NULL,
        company_id              BIGINT         NOT NULL,
        period_year             INT            NOT NULL,
        period_half             VARCHAR(2)     NOT NULL,
        evaluation_type         VARCHAR(30)    NOT NULL DEFAULT 'REGULAR',
        evaluator_user_id       BIGINT         NOT NULL,
        status                  VARCHAR(20)    NOT NULL DEFAULT 'DRAFT',
        total_score             DECIMAL(7,2)   NULL,
        max_total_score         DECIMAL(7,2)   NULL,
        score_percentage        DECIMAL(5,2)   NULL,
        qualified               BIT            NULL,
        qualification_threshold DECIMAL(5,2)   NOT NULL DEFAULT 60.00,
        comment                 NVARCHAR(2000) NULL,
        submitted_at            DATETIME2      NULL,
        approved_by             BIGINT         NULL,
        approved_at             DATETIME2      NULL,
        rejected_reason         NVARCHAR(1000) NULL,
        created_at              DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at              DATETIME2      NULL,
        deleted                 BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_evaluation PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_evaluation_evaluation_no UNIQUE (evaluation_no),
        CONSTRAINT UQ_tb_evaluation_company_period UNIQUE (company_id, period_year, period_half, evaluation_type),
        CONSTRAINT CK_tb_evaluation_period_half   CHECK (period_half IN ('H1','H2')),
        CONSTRAINT CK_tb_evaluation_status        CHECK (status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED')),
        CONSTRAINT CK_tb_evaluation_type          CHECK (evaluation_type IN ('REGULAR','SPECIAL')),
        CONSTRAINT FK_evaluation_company          FOREIGN KEY (company_id)        REFERENCES tb_company(id),
        CONSTRAINT FK_evaluation_evaluator        FOREIGN KEY (evaluator_user_id) REFERENCES tb_user(id),
        CONSTRAINT FK_evaluation_approver         FOREIGN KEY (approved_by)       REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'협력업체 평가 헤더. evaluation_no: EV-YYYYNN-NNNN.', 'SCHEMA', 'dbo', 'TABLE', 'tb_evaluation';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_company_period')
    CREATE INDEX IX_tb_evaluation_company_period ON tb_evaluation(company_id, period_year DESC, period_half DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_status')
    CREATE INDEX IX_tb_evaluation_status ON tb_evaluation(status);
GO

-- tb_evaluation_item_score
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_evaluation_item_score')
BEGIN
    CREATE TABLE tb_evaluation_item_score (
        id              BIGINT         IDENTITY(1,1) NOT NULL,
        evaluation_id   BIGINT         NOT NULL,
        item_id         BIGINT         NOT NULL,
        score           DECIMAL(5,2)   NULL,
        max_score       DECIMAL(5,2)   NOT NULL,
        weight          DECIMAL(5,2)   NOT NULL,
        weighted_score  DECIMAL(7,2)   NULL,
        comment         NVARCHAR(1000) NULL,
        created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2      NULL,
        CONSTRAINT PK_tb_evaluation_item_score PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_evaluation_item_score_eval_item UNIQUE (evaluation_id, item_id),
        CONSTRAINT FK_evaluation_item_score_eval FOREIGN KEY (evaluation_id) REFERENCES tb_evaluation(id) ON DELETE CASCADE,
        CONSTRAINT FK_evaluation_item_score_item FOREIGN KEY (item_id)       REFERENCES tb_evaluation_item(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'평가별 항목 점수 (14 row/eval).', 'SCHEMA', 'dbo', 'TABLE', 'tb_evaluation_item_score';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_item_score_evaluation')
    CREATE INDEX IX_tb_evaluation_item_score_evaluation ON tb_evaluation_item_score(evaluation_id);
GO

-- tb_evaluation_attachment
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_evaluation_attachment')
BEGIN
    CREATE TABLE tb_evaluation_attachment (
        id             BIGINT         IDENTITY(1,1) NOT NULL,
        evaluation_id  BIGINT         NOT NULL,
        item_id        BIGINT         NULL,
        file_name      NVARCHAR(500)  NOT NULL,
        file_path      NVARCHAR(1000) NOT NULL,
        file_size      BIGINT         NULL,
        mime_type      VARCHAR(100)   NULL,
        uploaded_by    BIGINT         NOT NULL,
        uploaded_at    DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        deleted        BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_evaluation_attachment PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_evaluation_attachment_eval FOREIGN KEY (evaluation_id) REFERENCES tb_evaluation(id) ON DELETE CASCADE,
        CONSTRAINT FK_evaluation_attachment_item FOREIGN KEY (item_id)       REFERENCES tb_evaluation_item(id),
        CONSTRAINT FK_evaluation_attachment_user FOREIGN KEY (uploaded_by)   REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'협력업체 평가 첨부파일. item_id NULL = 헤더 공통 증빙.', 'SCHEMA', 'dbo', 'TABLE', 'tb_evaluation_attachment';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_attachment_evaluation')
    CREATE INDEX IX_tb_evaluation_attachment_evaluation ON tb_evaluation_attachment(evaluation_id);
GO

-- tb_evaluation_improvement
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_evaluation_improvement')
BEGIN
    CREATE TABLE tb_evaluation_improvement (
        id                 BIGINT         IDENTITY(1,1) NOT NULL,
        evaluation_id      BIGINT         NOT NULL,
        item_id            BIGINT         NULL,
        requested_by       BIGINT         NOT NULL,
        requested_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        request_content    NVARCHAR(2000) NOT NULL,
        response_content   NVARCHAR(2000) NULL,
        response_user_id   BIGINT         NULL,
        responded_at       DATETIME2      NULL,
        response_due_date  DATE           NULL,
        status             VARCHAR(20)    NOT NULL DEFAULT 'OPEN',
        created_at         DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at         DATETIME2      NULL,
        deleted            BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_evaluation_improvement PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_tb_evaluation_improvement_status CHECK (status IN ('OPEN','RESPONDED','CLOSED','OVERDUE')),
        CONSTRAINT FK_evaluation_improvement_eval      FOREIGN KEY (evaluation_id)    REFERENCES tb_evaluation(id),
        CONSTRAINT FK_evaluation_improvement_item      FOREIGN KEY (item_id)          REFERENCES tb_evaluation_item(id),
        CONSTRAINT FK_evaluation_improvement_requester FOREIGN KEY (requested_by)     REFERENCES tb_user(id),
        CONSTRAINT FK_evaluation_improvement_responder FOREIGN KEY (response_user_id) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'협력업체 평가 개선요청 이력. status: OPEN/RESPONDED/CLOSED/OVERDUE', 'SCHEMA', 'dbo', 'TABLE', 'tb_evaluation_improvement';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_improvement_eval_status')
    CREATE INDEX IX_tb_evaluation_improvement_eval_status ON tb_evaluation_improvement(evaluation_id, status);
GO

-- tb_som_company_snapshot
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_som_company_snapshot')
BEGIN
    CREATE TABLE tb_som_company_snapshot (
        id               BIGINT         IDENTITY(1,1) NOT NULL,
        business_number  VARCHAR(20)    NOT NULL,
        company_name     NVARCHAR(200)  NOT NULL,
        ceo_name         NVARCHAR(100)  NULL,
        address          NVARCHAR(500)  NULL,
        industry         NVARCHAR(100)  NULL,
        employee_count   INT            NULL,
        annual_revenue   DECIMAL(18,2)  NULL,
        last_synced_at   DATETIME2      NULL,
        created_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at       DATETIME2      NULL,
        CONSTRAINT PK_tb_som_company_snapshot PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_som_company_snapshot_biz UNIQUE (business_number)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'SOM 연동 협력사 스냅샷 (stub). business_number 가 연동 키.', 'SCHEMA', 'dbo', 'TABLE', 'tb_som_company_snapshot';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_som_company_snapshot_biz')
    CREATE INDEX IX_tb_som_company_snapshot_biz ON tb_som_company_snapshot(business_number);
GO


-- =====================================================================
-- [MIGRATION V8]  V8__phase4_evaluation_seed.sql
-- Phase 4 평가/개선요청/SOM 스냅샷 더미 시드
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- 1. tb_evaluation_item : 14개 평가 항목 시드 (V19에서 21개로 교체됨)
IF NOT EXISTS (SELECT 1 FROM tb_evaluation_item WHERE code = 'SAFETY_POLICY')
INSERT INTO tb_evaluation_item (code, category, title, description, max_score, weight, sort_order, active)
VALUES
    ('SAFETY_POLICY',        N'경영방침·조직', N'안전보건방침 수립 및 공표',     N'사업주의 안전보건 방침 문서화·게시, 정기 재검토 여부',              10, 1.00,  1, 1),
    ('SAFETY_MANAGER',       N'경영방침·조직', N'안전보건관리자 선임',           N'법정 안전관리자/보건관리자 선임 및 자격 보유',                       10, 1.20,  2, 1),
    ('SAFETY_BUDGET',        N'경영방침·조직', N'안전보건 예산 편성',            N'연간 안전보건 예산 편성 비율 및 집행 실적',                         10, 1.00,  3, 1),
    ('REGULAR_TRAINING',     N'교육·훈련',     N'정기 안전보건교육 이수',         N'분기별 정기 안전보건교육 이수율, 교육일지 기록',                    10, 1.00,  4, 1),
    ('SPECIAL_TRAINING',     N'교육·훈련',     N'특별·신규자 교육 이수',          N'유해위험작업 특별교육 및 신규 채용자 교육 이수율',                  10, 1.00,  5, 1),
    ('RISK_ASSESSMENT',      N'위험관리',      N'위험성평가 수행',               N'작업공정별 위험성평가 수행 및 개선조치 이행',                        10, 1.50,  6, 1),
    ('WORK_PERMIT',          N'위험관리',      N'작업허가제 운영',               N'밀폐/고소/화기작업 등 작업허가서 발행·관리',                         10, 1.20,  7, 1),
    ('PPE_PROVISION',        N'위험관리',      N'개인보호구 지급·관리',           N'작업자별 PPE 지급 대장, 착용 점검, 노후품 교체',                     10, 1.00,  8, 1),
    ('EQUIPMENT_INSPECTION', N'설비·환경',     N'장비·설비 정기점검',            N'중장비/고소작업대 등 점검 주기 준수, 점검일지',                     10, 1.00,  9, 1),
    ('WORK_ENV_MEASURE',     N'설비·환경',     N'작업환경 측정',                 N'소음/분진/유해화학물질 등 작업환경 측정 및 결과조치',                10, 1.00, 10, 1),
    ('ACCIDENT_RATE',        N'재해관리',      N'재해발생률',                    N'최근 1년 재해율(천인율) 지표. 동종업계 평균 대비 산정',              10, 1.50, 11, 1),
    ('ACCIDENT_REPORT',      N'재해관리',      N'재해 조사·보고 체계',           N'재해 발생 시 조사·원인분석·재발방지대책 수립 프로세스',              10, 1.00, 12, 1),
    ('WORKER_CONSULTATION',  N'협력체계',      N'근로자 의견청취·참여',          N'안전보건협의체 운영, 근로자 제안제도',                              10, 1.00, 13, 1),
    ('JOINT_INSPECTION',     N'협력체계',      N'정기 합동점검 참여',            N'발주사(팬오션)와의 합동 안전점검 참여율 및 지적사항 조치',           10, 1.00, 14, 1);
GO

-- 2. tb_evaluation : 7건 더미
IF NOT EXISTS (SELECT 1 FROM tb_evaluation WHERE evaluation_no = 'EV-202601-0001')
BEGIN
DECLARE @ADMIN_ID_V8    BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CO_DAEHAN_V8   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL_V8    BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN_V8    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_OCEAN_V8    BIGINT = (SELECT id FROM tb_company WHERE business_number = '444-44-44444');
DECLARE @CO_HALLA_V8    BIGINT = (SELECT id FROM tb_company WHERE business_number = '555-55-55555');
DECLARE @CO_DONGBANG_V8 BIGINT = (SELECT id FROM tb_company WHERE business_number = '666-66-66666');

INSERT INTO tb_evaluation
    (evaluation_no, company_id, period_year, period_half, evaluation_type, evaluator_user_id,
     status, qualification_threshold, comment, submitted_at, approved_by, approved_at, rejected_reason)
VALUES
    ('EV-202601-0001', @CO_DAEHAN_V8,   2026, 'H1', 'REGULAR', @ADMIN_ID_V8,
     'DRAFT',     60.00, N'초안 작성 중 - 증빙 수집 대기', NULL, NULL, NULL, NULL),
    ('EV-202601-0002', @CO_SEOUL_V8,    2026, 'H1', 'REGULAR', @ADMIN_ID_V8,
     'SUBMITTED', 60.00, N'제출 완료. 승인 대기.', DATEADD(day, -5, SYSUTCDATETIME()), NULL, NULL, NULL),
    ('EV-202601-0003', @CO_OCEAN_V8,    2026, 'H1', 'REGULAR', @ADMIN_ID_V8,
     'SUBMITTED', 60.00, N'제출 완료. 1차 검토 진행 중.', DATEADD(day, -3, SYSUTCDATETIME()), NULL, NULL, NULL),
    ('EV-202601-0004', @CO_BUSAN_V8,    2026, 'H1', 'REGULAR', @ADMIN_ID_V8,
     'APPROVED',  60.00, N'전반적으로 양호. 재해관리 우수.', DATEADD(day, -20, SYSUTCDATETIME()), @ADMIN_ID_V8, DATEADD(day, -15, SYSUTCDATETIME()), NULL),
    ('EV-202601-0005', @CO_HALLA_V8,    2026, 'H1', 'REGULAR', @ADMIN_ID_V8,
     'APPROVED',  60.00, N'교육 이수율 높음. 적격.', DATEADD(day, -18, SYSUTCDATETIME()), @ADMIN_ID_V8, DATEADD(day, -12, SYSUTCDATETIME()), NULL),
    ('EV-202502-0001', @CO_DAEHAN_V8,   2025, 'H2', 'REGULAR', @ADMIN_ID_V8,
     'APPROVED',  60.00, N'2025년 하반기 정기평가 적격.', DATEADD(day, -120, SYSUTCDATETIME()), @ADMIN_ID_V8, DATEADD(day, -110, SYSUTCDATETIME()), NULL),
    ('EV-202601-0006', @CO_DONGBANG_V8, 2026, 'H1', 'REGULAR', @ADMIN_ID_V8,
     'REJECTED',  60.00, N'부적격 - 재해율 기준 초과', DATEADD(day, -10, SYSUTCDATETIME()), @ADMIN_ID_V8, DATEADD(day, -7, SYSUTCDATETIME()),
     N'최근 1년 재해율이 동종업계 평균 대비 과다.');
END;
GO

-- 3. tb_evaluation_item_score : 각 평가 × 항목
IF NOT EXISTS (SELECT 1 FROM tb_evaluation_item_score)
BEGIN
DECLARE @evalId BIGINT, @status VARCHAR(20);

DECLARE eval_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT id, status FROM tb_evaluation ORDER BY id;

OPEN eval_cursor;
FETCH NEXT FROM eval_cursor INTO @evalId, @status;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO tb_evaluation_item_score (evaluation_id, item_id, score, max_score, weight, weighted_score, comment)
    SELECT @evalId, i.id,
        CASE
            WHEN @status = 'DRAFT'     AND i.sort_order > 5 THEN NULL
            WHEN @status = 'DRAFT'                          THEN CAST(6 + (i.sort_order % 4) AS DECIMAL(5,2))
            WHEN @status = 'SUBMITTED'                      THEN CAST(7 + (i.sort_order % 3) AS DECIMAL(5,2))
            WHEN @status = 'APPROVED'                       THEN CAST(7 + ((i.sort_order * 7) % 4) AS DECIMAL(5,2))
            WHEN @status = 'REJECTED'  AND i.category = N'재해관리' THEN CAST(3 AS DECIMAL(5,2))
            WHEN @status = 'REJECTED'                       THEN CAST(4 + (i.sort_order % 3) AS DECIMAL(5,2))
        END AS score,
        CAST(i.max_score AS DECIMAL(5,2)), i.weight,
        CASE
            WHEN @status = 'DRAFT'     AND i.sort_order > 5 THEN NULL
            WHEN @status = 'DRAFT'                          THEN CAST((6 + (i.sort_order % 4)) * i.weight AS DECIMAL(7,2))
            WHEN @status = 'SUBMITTED'                      THEN CAST((7 + (i.sort_order % 3)) * i.weight AS DECIMAL(7,2))
            WHEN @status = 'APPROVED'                       THEN CAST((7 + ((i.sort_order * 7) % 4)) * i.weight AS DECIMAL(7,2))
            WHEN @status = 'REJECTED'  AND i.category = N'재해관리' THEN CAST(3 * i.weight AS DECIMAL(7,2))
            WHEN @status = 'REJECTED'                       THEN CAST((4 + (i.sort_order % 3)) * i.weight AS DECIMAL(7,2))
        END AS weighted_score, NULL
    FROM tb_evaluation_item i
    WHERE i.active = 1 AND i.deleted = 0;

    FETCH NEXT FROM eval_cursor INTO @evalId, @status;
END;

CLOSE eval_cursor;
DEALLOCATE eval_cursor;
END;
GO

-- 4. tb_evaluation 집계 업데이트
UPDATE e
   SET total_score      = agg.total_weighted,
       max_total_score  = agg.max_weighted,
       score_percentage = CASE WHEN agg.max_weighted > 0 THEN CAST(agg.total_weighted * 100.0 / agg.max_weighted AS DECIMAL(5,2)) ELSE NULL END,
       qualified        = CASE WHEN agg.max_weighted > 0 AND (agg.total_weighted * 100.0 / agg.max_weighted) >= e.qualification_threshold THEN 1 ELSE 0 END,
       updated_at       = SYSUTCDATETIME()
  FROM tb_evaluation e
 CROSS APPLY (
        SELECT SUM(s.weighted_score) AS total_weighted, SUM(s.max_score * s.weight) AS max_weighted
          FROM tb_evaluation_item_score s
         WHERE s.evaluation_id = e.id AND s.score IS NOT NULL
 ) agg
 WHERE e.status <> 'DRAFT';
GO

-- 5. tb_evaluation_attachment
IF NOT EXISTS (SELECT 1 FROM tb_evaluation_attachment)
BEGIN
DECLARE @ADMIN_ID_V8B BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');

INSERT INTO tb_evaluation_attachment (evaluation_id, item_id, file_name, file_path, file_size, mime_type, uploaded_by)
SELECT e.id, NULL, N'평가증빙_' + e.evaluation_no + N'.pdf', N'/uploads/evaluation/' + e.evaluation_no + N'/summary.pdf', 524288, 'application/pdf', @ADMIN_ID_V8B
  FROM tb_evaluation e WHERE e.status IN ('APPROVED','SUBMITTED');

INSERT INTO tb_evaluation_attachment (evaluation_id, item_id, file_name, file_path, file_size, mime_type, uploaded_by)
SELECT e.id, i.id, N'위험성평가_' + e.evaluation_no + N'.pdf', N'/uploads/evaluation/' + e.evaluation_no + N'/risk_assessment.pdf', 786432, 'application/pdf', @ADMIN_ID_V8B
  FROM tb_evaluation e CROSS JOIN tb_evaluation_item i
 WHERE e.status = 'APPROVED' AND i.code = 'RISK_ASSESSMENT';
END;
GO

-- 6. tb_evaluation_improvement
IF NOT EXISTS (SELECT 1 FROM tb_evaluation_improvement)
BEGIN
DECLARE @ADMIN_V8C BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_V8C   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @EV_BUSAN_V8  BIGINT = (SELECT id FROM tb_evaluation WHERE evaluation_no = 'EV-202601-0004');
DECLARE @EV_HALLA_V8  BIGINT = (SELECT id FROM tb_evaluation WHERE evaluation_no = 'EV-202601-0005');
DECLARE @EV_DAEHAN_V8 BIGINT = (SELECT id FROM tb_evaluation WHERE evaluation_no = 'EV-202502-0001');
DECLARE @IT_PPE_V8      BIGINT = (SELECT id FROM tb_evaluation_item WHERE code = 'PPE_PROVISION');
DECLARE @IT_ENV_V8      BIGINT = (SELECT id FROM tb_evaluation_item WHERE code = 'WORK_ENV_MEASURE');
DECLARE @IT_TRAINING_V8 BIGINT = (SELECT id FROM tb_evaluation_item WHERE code = 'REGULAR_TRAINING');

INSERT INTO tb_evaluation_improvement
    (evaluation_id, item_id, requested_by, requested_at, request_content, response_content, response_user_id, responded_at, response_due_date, status)
VALUES
    (@EV_BUSAN_V8, @IT_PPE_V8, @ADMIN_V8C, DATEADD(day, -14, SYSUTCDATETIME()),
     N'개인보호구(PPE) 지급 대장 최신화 및 노후품 교체 내역 제출 바랍니다.',
     NULL, NULL, NULL, DATEADD(day, 16, SYSUTCDATETIME()), 'OPEN'),
    (@EV_HALLA_V8, @IT_ENV_V8, @ADMIN_V8C, DATEADD(day, -11, SYSUTCDATETIME()),
     N'작업환경 측정 결과 중 분진 항목 기준 초과 구간에 대한 개선계획 제출 요청.',
     N'해당 구간 국소배기장치 증설 완료 및 재측정 결과 첨부합니다.',
     @CT1_V8C, DATEADD(day, -4, SYSUTCDATETIME()), DATEADD(day, 19, SYSUTCDATETIME()), 'RESPONDED'),
    (@EV_DAEHAN_V8, @IT_TRAINING_V8, @ADMIN_V8C, DATEADD(day, -100, SYSUTCDATETIME()),
     N'정기 안전보건교육 이수율 90% 미만 근로자 대상 보충교육 실시 요청.',
     N'보충교육 2회차 실시 완료. 이수율 100% 달성.',
     @CT1_V8C, DATEADD(day, -80, SYSUTCDATETIME()), DATEADD(day, -70, SYSUTCDATETIME()), 'CLOSED');
END;
GO

-- 7. tb_som_company_snapshot
IF NOT EXISTS (SELECT 1 FROM tb_som_company_snapshot)
INSERT INTO tb_som_company_snapshot (business_number, company_name, ceo_name, address, industry, employee_count, annual_revenue, last_synced_at)
SELECT c.business_number, c.name, c.ceo_name, c.address, c.industry_code,
       50 + (CAST(RIGHT(c.business_number, 2) AS INT) % 80) AS employee_count,
       CAST((100 + (CAST(RIGHT(c.business_number, 3) AS INT) % 900)) * 100000000.0 AS DECIMAL(18,2)) AS annual_revenue,
       DATEADD(day, -1, SYSUTCDATETIME())
  FROM tb_company c WHERE c.deleted = 0
   AND NOT EXISTS (SELECT 1 FROM tb_som_company_snapshot s WHERE s.business_number = c.business_number);
GO


-- =====================================================================
-- [MIGRATION V9]  V9__phase5_schema.sql
-- Phase 5: 근로자 의견조회 / 산업재해 / 안전보건실적(육상·해상) / 해상직원 상세
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- tb_worker_voice
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_worker_voice')
BEGIN
    CREATE TABLE tb_worker_voice (
        id                  BIGINT         IDENTITY(1,1) NOT NULL,
        voice_no            VARCHAR(30)    NOT NULL,
        voice_type          VARCHAR(30)    NOT NULL,
        title               NVARCHAR(500)  NOT NULL,
        content             NVARCHAR(MAX)  NOT NULL,
        company_id          BIGINT         NOT NULL,
        vessel_id           BIGINT         NULL,
        reporter_user_id    BIGINT         NOT NULL,
        reporter_anonymous  BIT            NOT NULL DEFAULT 0,
        severity            VARCHAR(20)    NULL,
        status              VARCHAR(30)    NOT NULL DEFAULT 'SUBMITTED',
        assigned_to         BIGINT         NULL,
        resolved_at         DATETIME2      NULL,
        resolution          NVARCHAR(2000) NULL,
        email_sent_to       NVARCHAR(500)  NULL,
        created_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2      NULL,
        deleted             BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_worker_voice                PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_worker_voice_voice_no       UNIQUE (voice_no),
        CONSTRAINT CK_tb_worker_voice_type           CHECK (voice_type IN ('NEAR_MISS','INCIDENT','INQUIRY')),
        CONSTRAINT CK_tb_worker_voice_status         CHECK (status IN ('SUBMITTED','TRIAGED','IN_PROGRESS','RESOLVED','CLOSED')),
        CONSTRAINT CK_tb_worker_voice_severity       CHECK (severity IS NULL OR severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
        CONSTRAINT FK_worker_voice_company           FOREIGN KEY (company_id)       REFERENCES tb_company(id),
        CONSTRAINT FK_worker_voice_vessel            FOREIGN KEY (vessel_id)        REFERENCES tb_vessel(id),
        CONSTRAINT FK_worker_voice_reporter          FOREIGN KEY (reporter_user_id) REFERENCES tb_user(id),
        CONSTRAINT FK_worker_voice_assignee          FOREIGN KEY (assigned_to)      REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'근로자 의견조회 (아차사고/산업재해/일반문의). voice_no: WV-YYYYMMDD-NNNN.', 'SCHEMA', 'dbo', 'TABLE', 'tb_worker_voice';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_worker_voice_type_status')
    CREATE INDEX IX_tb_worker_voice_type_status ON tb_worker_voice(voice_type, status);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_worker_voice_company_created')
    CREATE INDEX IX_tb_worker_voice_company_created ON tb_worker_voice(company_id, created_at DESC);
GO

-- tb_voice_attachment
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_voice_attachment')
BEGIN
    CREATE TABLE tb_voice_attachment (
        id           BIGINT         IDENTITY(1,1) NOT NULL,
        voice_id     BIGINT         NOT NULL,
        file_name    NVARCHAR(500)  NOT NULL,
        file_path    NVARCHAR(1000) NOT NULL,
        file_size    BIGINT         NULL,
        mime_type    VARCHAR(100)   NULL,
        uploaded_by  BIGINT         NOT NULL,
        uploaded_at  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        deleted      BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_voice_attachment        PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_voice_attachment_voice     FOREIGN KEY (voice_id)    REFERENCES tb_worker_voice(id) ON DELETE CASCADE,
        CONSTRAINT FK_voice_attachment_uploader  FOREIGN KEY (uploaded_by) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'근로자 의견 첨부파일.', 'SCHEMA', 'dbo', 'TABLE', 'tb_voice_attachment';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_voice_attachment_voice')
    CREATE INDEX IX_tb_voice_attachment_voice ON tb_voice_attachment(voice_id);
GO

-- tb_industrial_accident
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_industrial_accident')
BEGIN
    CREATE TABLE tb_industrial_accident (
        id                BIGINT         IDENTITY(1,1) NOT NULL,
        accident_no       VARCHAR(30)    NOT NULL,
        company_id        BIGINT         NOT NULL,
        business_number   VARCHAR(20)    NOT NULL,
        vessel_id         BIGINT         NULL,
        accident_date     DATE           NOT NULL,
        accident_location NVARCHAR(500)  NULL,
        victim_name       NVARCHAR(100)  NOT NULL,
        victim_age        INT            NULL,
        victim_gender     VARCHAR(10)    NULL,
        victim_role       NVARCHAR(100)  NULL,
        accident_type     VARCHAR(50)    NOT NULL,
        severity          VARCHAR(20)    NOT NULL,
        description       NVARCHAR(2000) NULL,
        treatment_days    INT            NULL,
        absence_days      INT            NULL,
        reported_by       BIGINT         NOT NULL,
        reported_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        report_file_url   NVARCHAR(500)  NULL,
        created_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at        DATETIME2      NULL,
        deleted           BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_industrial_accident              PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_industrial_accident_accident_no  UNIQUE (accident_no),
        CONSTRAINT CK_tb_industrial_accident_type         CHECK (accident_type IN ('FALL','STRUCK','CUT','BURN','ELECTRIC','OTHER')),
        CONSTRAINT CK_tb_industrial_accident_severity     CHECK (severity IN ('MINOR','SERIOUS','FATAL')),
        CONSTRAINT CK_tb_industrial_accident_gender       CHECK (victim_gender IS NULL OR victim_gender IN ('M','F','OTHER')),
        CONSTRAINT FK_industrial_accident_company         FOREIGN KEY (company_id)  REFERENCES tb_company(id),
        CONSTRAINT FK_industrial_accident_vessel          FOREIGN KEY (vessel_id)   REFERENCES tb_vessel(id),
        CONSTRAINT FK_industrial_accident_reporter        FOREIGN KEY (reported_by) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'산업재해 등록 (재해조사표). accident_no: IA-YYYYMMDD-NNNN.', 'SCHEMA', 'dbo', 'TABLE', 'tb_industrial_accident';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_industrial_accident_business')
    CREATE INDEX IX_tb_industrial_accident_business ON tb_industrial_accident(business_number);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_industrial_accident_company_date')
    CREATE INDEX IX_tb_industrial_accident_company_date ON tb_industrial_accident(company_id, accident_date DESC);
GO

-- tb_safety_performance_land
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_safety_performance_land')
BEGIN
    CREATE TABLE tb_safety_performance_land (
        id                 BIGINT         IDENTITY(1,1) NOT NULL,
        department_id      BIGINT         NOT NULL,
        period_year        INT            NOT NULL,
        period_month       INT            NOT NULL,
        manhours           BIGINT         NOT NULL DEFAULT 0,
        accident_count     INT            NOT NULL DEFAULT 0,
        lost_time_count    INT            NOT NULL DEFAULT 0,
        fatality_count     INT            NOT NULL DEFAULT 0,
        trir               DECIMAL(7,3)   NULL,
        ltir               DECIMAL(7,3)   NULL,
        budget_planned     DECIMAL(15,2)  NULL,
        budget_used        DECIMAL(15,2)  NULL,
        fcm_project_code   VARCHAR(50)    NULL,
        vbp_project_code   VARCHAR(50)    NULL,
        reported_by        BIGINT         NOT NULL,
        comment            NVARCHAR(1000) NULL,
        created_at         DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at         DATETIME2      NULL,
        deleted            BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_safety_performance_land           PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_safety_performance_land_period    UNIQUE (department_id, period_year, period_month),
        CONSTRAINT CK_tb_safety_performance_land_month     CHECK (period_month BETWEEN 1 AND 12),
        CONSTRAINT FK_safety_performance_land_dept         FOREIGN KEY (department_id) REFERENCES tb_department(id),
        CONSTRAINT FK_safety_performance_land_reporter     FOREIGN KEY (reported_by)   REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'육상 안전보건실적 (월별). TRIR/LTIR 지표, FCM/VBP 연동 예산.', 'SCHEMA', 'dbo', 'TABLE', 'tb_safety_performance_land';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_safety_performance_land_period')
    CREATE INDEX IX_tb_safety_performance_land_period ON tb_safety_performance_land(period_year, period_month);
GO

-- tb_safety_performance_sea
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_safety_performance_sea')
BEGIN
    CREATE TABLE tb_safety_performance_sea (
        id                 BIGINT         IDENTITY(1,1) NOT NULL,
        vessel_id          BIGINT         NOT NULL,
        period_year        INT            NOT NULL,
        period_month       INT            NOT NULL,
        crew_count         INT            NOT NULL DEFAULT 0,
        illness_count      INT            NOT NULL DEFAULT 0,
        injury_count       INT            NOT NULL DEFAULT 0,
        evacuation_count   INT            NOT NULL DEFAULT 0,
        sick_leave_days    INT            NOT NULL DEFAULT 0,
        pos_sm_synced_at   DATETIME2      NULL,
        excel_upload_id    VARCHAR(100)   NULL,
        uploaded_by        BIGINT         NOT NULL,
        comment            NVARCHAR(1000) NULL,
        created_at         DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at         DATETIME2      NULL,
        deleted            BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_safety_performance_sea           PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_safety_performance_sea_period    UNIQUE (vessel_id, period_year, period_month),
        CONSTRAINT CK_tb_safety_performance_sea_month     CHECK (period_month BETWEEN 1 AND 12),
        CONSTRAINT FK_safety_performance_sea_vessel       FOREIGN KEY (vessel_id)   REFERENCES tb_vessel(id),
        CONSTRAINT FK_safety_performance_sea_uploader     FOREIGN KEY (uploaded_by) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'해상 안전보건실적 (선박×월). 승선/질병/부상/하선.', 'SCHEMA', 'dbo', 'TABLE', 'tb_safety_performance_sea';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_safety_performance_sea_vessel_period')
    CREATE INDEX IX_tb_safety_performance_sea_vessel_period ON tb_safety_performance_sea(vessel_id, period_year DESC, period_month DESC);
GO

-- tb_sea_crew_incident
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_sea_crew_incident')
BEGIN
    CREATE TABLE tb_sea_crew_incident (
        id                    BIGINT         IDENTITY(1,1) NOT NULL,
        vessel_id             BIGINT         NOT NULL,
        period_year           INT            NOT NULL,
        period_month          INT            NOT NULL,
        crew_name             NVARCHAR(100)  NOT NULL,
        crew_role             NVARCHAR(100)  NULL,
        incident_type         VARCHAR(30)    NOT NULL,
        incident_date         DATE           NOT NULL,
        diagnosis             NVARCHAR(500)  NULL,
        evacuation_required   BIT            NOT NULL DEFAULT 0,
        return_to_duty_date   DATE           NULL,
        excel_upload_id       VARCHAR(100)   NULL,
        created_at            DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at            DATETIME2      NULL,
        deleted               BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_sea_crew_incident           PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_tb_sea_crew_incident_type      CHECK (incident_type IN ('ILLNESS','INJURY')),
        CONSTRAINT CK_tb_sea_crew_incident_month     CHECK (period_month BETWEEN 1 AND 12),
        CONSTRAINT FK_sea_crew_incident_vessel       FOREIGN KEY (vessel_id) REFERENCES tb_vessel(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'해상직원 질병/부상 상세 (엑셀 일괄). incident_type: ILLNESS/INJURY.', 'SCHEMA', 'dbo', 'TABLE', 'tb_sea_crew_incident';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_sea_crew_incident_vessel_date')
    CREATE INDEX IX_tb_sea_crew_incident_vessel_date ON tb_sea_crew_incident(vessel_id, incident_date DESC);
GO


-- =====================================================================
-- [MIGRATION V10]  V10__phase5_seed.sql
-- Phase 5 더미 시드 (근로자 의견 / 산업재해 / 안전실적)
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- 1. tb_worker_voice
IF NOT EXISTS (SELECT 1 FROM tb_worker_voice WHERE voice_no = 'WV-20260320-0001')
BEGIN
DECLARE @ADMIN_ID_V10    BIGINT = (SELECT id FROM tb_user    WHERE username = 'admin');
DECLARE @CT1_ID_V10      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract1');
DECLARE @CT2_ID_V10      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract2');
DECLARE @CT3_ID_V10      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract3');
DECLARE @C1_ID_V10       BIGINT = (SELECT id FROM tb_user    WHERE username = 'contractor1');
DECLARE @C2_ID_V10       BIGINT = (SELECT id FROM tb_user    WHERE username = 'contractor2');
DECLARE @C3_ID_V10       BIGINT = (SELECT id FROM tb_user    WHERE username = 'contractor3');

DECLARE @CO_DAEHAN_V10   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL_V10    BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @CO_BUSAN_V10    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_OCEAN_V10    BIGINT = (SELECT id FROM tb_company WHERE business_number = '444-44-44444');
DECLARE @CO_HALLA_V10    BIGINT = (SELECT id FROM tb_company WHERE business_number = '555-55-55555');
DECLARE @CO_HANBIT_V10   BIGINT = (SELECT id FROM tb_company WHERE business_number = '777-77-77777');
DECLARE @CO_TAEYANG_V10  BIGINT = (SELECT id FROM tb_company WHERE business_number = '888-88-88888');

DECLARE @V_BONA_V10      BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_TAEAN_V10     BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V002');
DECLARE @V_CLIPPER_V10   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V004');
DECLARE @V_HARMONY_V10   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V005');
DECLARE @NOW_V10 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_worker_voice (voice_no, voice_type, title, content, company_id, vessel_id, reporter_user_id, reporter_anonymous, severity, status, assigned_to, resolved_at, resolution, email_sent_to, created_at)
VALUES
    ('WV-20260320-0001', 'NEAR_MISS',   N'고소작업 중 안전벨트 미체결 목격',
     N'PAN BONA 상갑판에서 작업자가 고소작업 중 안전벨트 후크를 결속하지 않은 상태로 이동하는 것을 목격했습니다.',
     @CO_BUSAN_V10, @V_BONA_V10, @C3_ID_V10, 0, NULL, 'TRIAGED', @CT1_ID_V10,
     NULL, NULL, N'safety@panocean.com', DATEADD(day, -29, @NOW_V10)),
    ('WV-20260328-0002', 'NEAR_MISS',   N'하역장 크레인 하부 보행 위험',
     N'부산하역 작업장에서 크레인 작업 반경 내를 지나가는 보행자가 있어 사고로 이어질 뻔했습니다.',
     @CO_BUSAN_V10, NULL, @C3_ID_V10, 1, NULL, 'IN_PROGRESS', @CT2_ID_V10,
     NULL, NULL, N'safety@panocean.com', DATEADD(day, -21, @NOW_V10)),
    ('WV-20260402-0003', 'NEAR_MISS',   N'계단 손잡이 파손 발견',
     N'PAN TAEAN 기관실 진입 계단 손잡이가 부식되어 흔들립니다. 교체 필요.',
     @CO_DAEHAN_V10, @V_TAEAN_V10, @C1_ID_V10, 0, NULL, 'RESOLVED', @CT3_ID_V10,
     DATEADD(day, -8, @NOW_V10), N'손잡이 전량 교체 완료 (2026-04-10). 재점검 정상.',
     N'safety@panocean.com;vessel@panocean.com', DATEADD(day, -16, @NOW_V10)),
    ('WV-20260310-0004', 'INCIDENT',    N'도장작업 중 손가락 열상 발생',
     N'한빛도장 작업자 1명이 도장 보조기구 교체 중 커터날에 손가락이 베이는 사고가 발생. 응급처치 후 병원 이송.',
     @CO_HANBIT_V10, NULL, @C1_ID_V10, 0, 'MEDIUM', 'RESOLVED', @ADMIN_ID_V10,
     DATEADD(day, -18, @NOW_V10), N'원인분석 완료, 전원 보호장갑 지급 및 재교육 완료.',
     N'safety@panocean.com;hr@panocean.com', DATEADD(day, -39, @NOW_V10)),
    ('WV-20260415-0005', 'INCIDENT',    N'용접작업 중 화상 발생',
     N'태양용접 작업자 1명 용접 불꽃이 작업복 안으로 튀어 우측 팔뚝 2도 화상. 치료 진행 중.',
     @CO_TAEYANG_V10, @V_CLIPPER_V10, @C2_ID_V10, 0, 'HIGH', 'IN_PROGRESS', @ADMIN_ID_V10,
     NULL, NULL, N'safety@panocean.com;hr@panocean.com', DATEADD(day, -3, @NOW_V10)),
    ('WV-20260325-0006', 'INQUIRY',     N'개인보호구 지급 주기 문의',
     N'안전화 교체 주기가 어떻게 되는지, 낡은 경우 개별 신청 가능한지 확인 부탁드립니다.',
     @CO_SEOUL_V10, NULL, @C2_ID_V10, 0, NULL, 'RESOLVED', @CT1_ID_V10,
     DATEADD(day, -20, @NOW_V10), N'안전화 지급 기준 6개월 주기 안내. 파손 시 즉시 교체 신청 가능.',
     N'hr@panocean.com', DATEADD(day, -24, @NOW_V10)),
    ('WV-20260405-0007', 'INQUIRY',     N'안전교육 온라인 수강 가능 여부',
     N'해외 출장이 많은 직원 대상으로 안전교육을 온라인으로 이수할 수 있는지 문의드립니다.',
     @CO_OCEAN_V10, NULL, @C1_ID_V10, 0, NULL, 'SUBMITTED', NULL,
     NULL, NULL, N'hr@panocean.com', DATEADD(day, -13, @NOW_V10)),
    ('WV-20260412-0008', 'INQUIRY',     N'해상 응급의료 체계 확인',
     N'선박에서 부상 발생 시 연락 체계 및 대응 매뉴얼 공유 요청드립니다.',
     @CO_HALLA_V10, @V_HARMONY_V10, @C1_ID_V10, 0, NULL, 'CLOSED', @CT3_ID_V10,
     DATEADD(day, -4, @NOW_V10), N'응급의료 매뉴얼 v2.3 배포 및 숙지 확인 완료.',
     N'safety@panocean.com;vessel@panocean.com', DATEADD(day, -6, @NOW_V10));
END;
GO

-- 2. tb_industrial_accident
IF NOT EXISTS (SELECT 1 FROM tb_industrial_accident WHERE accident_no = 'IA-20260308-0001')
BEGIN
DECLARE @ADMIN_ID_V10B    BIGINT = (SELECT id FROM tb_user    WHERE username = 'admin');
DECLARE @CT1_ID_V10B      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract1');
DECLARE @CT2_ID_V10B      BIGINT = (SELECT id FROM tb_user    WHERE username = 'contract2');
DECLARE @CO_DAEHAN_V10B   BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_BUSAN_V10B    BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_DONGBANG_V10B BIGINT = (SELECT id FROM tb_company WHERE business_number = '666-66-66666');
DECLARE @CO_HANBIT_V10B   BIGINT = (SELECT id FROM tb_company WHERE business_number = '777-77-77777');
DECLARE @CO_TAEYANG_V10B  BIGINT = (SELECT id FROM tb_company WHERE business_number = '888-88-88888');
DECLARE @V_BONA_V10B      BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_CLIPPER_V10B   BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V004');

INSERT INTO tb_industrial_accident (accident_no, company_id, business_number, vessel_id, accident_date, accident_location, victim_name, victim_age, victim_gender, victim_role, accident_type, severity, description, treatment_days, absence_days, reported_by, reported_at, report_file_url)
VALUES
    ('IA-20260308-0001', @CO_HANBIT_V10B,   '777-77-77777', NULL, '2026-03-08',
     N'광양조선소 3번 도크 도장작업장', N'김도장', 42, 'M', N'도장공',
     'CUT', 'MINOR', N'도장 보조기구 교체 중 커터날에 우측 검지 열상.', 7, 3,
     @CT1_ID_V10B, DATEADD(day, -40, SYSUTCDATETIME()), N'/uploads/accident/IA-20260308-0001/report.pdf'),
    ('IA-20260315-0002', @CO_BUSAN_V10B,    '333-33-33333', NULL, '2026-03-15',
     N'부산항 4부두 하역장', N'박하역', 51, 'M', N'지게차 기사',
     'STRUCK', 'SERIOUS', N'지게차 후진 중 적재물과 추돌. 흉부 타박상 및 갈비뼈 골절.', 30, 21,
     @ADMIN_ID_V10B, DATEADD(day, -33, SYSUTCDATETIME()), N'/uploads/accident/IA-20260315-0002/report.pdf'),
    ('IA-20260322-0003', @CO_DONGBANG_V10B, '666-66-66666', @V_CLIPPER_V10B, '2026-03-22',
     N'PAN CLIPPER 기관실', N'강수리', 38, 'M', N'정비기사',
     'FALL', 'SERIOUS', N'기관실 사다리에서 발을 헛디뎌 2m 추락. 우측 발목 골절 및 요추 염좌.', 45, 35,
     @CT2_ID_V10B, DATEADD(day, -26, SYSUTCDATETIME()), N'/uploads/accident/IA-20260322-0003/report.pdf'),
    ('IA-20260405-0004', @CO_TAEYANG_V10B,  '888-88-88888', @V_CLIPPER_V10B, '2026-04-05',
     N'PAN CLIPPER 갑판 용접 작업장', N'윤용접', 35, 'M', N'용접공',
     'BURN', 'SERIOUS', N'용접 불꽃이 작업복 안으로 튀어 우측 팔뚝 2도 화상 (면적 약 8%).', 21, 14,
     @ADMIN_ID_V10B, DATEADD(day, -12, SYSUTCDATETIME()), N'/uploads/accident/IA-20260405-0004/report.pdf'),
    ('IA-20260410-0005', @CO_DAEHAN_V10B,   '111-11-11111', @V_BONA_V10B, '2026-04-10',
     N'PAN BONA 1번 홀드', N'이검수', 29, 'M', N'검수원',
     'ELECTRIC', 'MINOR', N'임시조명 점검 중 노후 케이블 누전으로 감전. 경미한 전기쇼크.', 3, 1,
     @CT1_ID_V10B, DATEADD(day, -7, SYSUTCDATETIME()), N'/uploads/accident/IA-20260410-0005/report.pdf');
END;
GO

-- 3. tb_safety_performance_land
IF NOT EXISTS (SELECT 1 FROM tb_safety_performance_land)
BEGIN
DECLARE @ADMIN_ID_V10C BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_ID_V10C   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CT2_ID_V10C   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');
DECLARE @CT3_ID_V10C   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');
DECLARE @D_SAFETY_V10 BIGINT = (SELECT id FROM tb_department WHERE code = 'SAFETY_MGMT');
DECLARE @D_PURCH_V10  BIGINT = (SELECT id FROM tb_department WHERE code = 'PURCHASING');
DECLARE @D_OPER_V10   BIGINT = (SELECT id FROM tb_department WHERE code = 'OPERATION');
DECLARE @D_VESSEL_V10 BIGINT = (SELECT id FROM tb_department WHERE code = 'VESSEL_MGMT');
DECLARE @D_SALES_V10  BIGINT = (SELECT id FROM tb_department WHERE code = 'SALES');

INSERT INTO tb_safety_performance_land (department_id, period_year, period_month, manhours, accident_count, lost_time_count, fatality_count, trir, ltir, budget_planned, budget_used, fcm_project_code, vbp_project_code, reported_by, comment)
VALUES
    (@D_SAFETY_V10, 2026, 2, 18400, 0, 0, 0, 0.000, 0.000, 15000000.00, 12800000.00, 'FCM-SAF-2026', 'VBP-SAF-26H1', @ADMIN_ID_V10C, N'2월 무재해 달성'),
    (@D_SAFETY_V10, 2026, 3, 19200, 1, 0, 0, 1.042, 0.000, 15000000.00, 14200000.00, 'FCM-SAF-2026', 'VBP-SAF-26H1', @ADMIN_ID_V10C, N'경미 1건 (응급처치)'),
    (@D_SAFETY_V10, 2026, 4, 16800, 0, 0, 0, 0.000, 0.000, 15000000.00,  8100000.00, 'FCM-SAF-2026', 'VBP-SAF-26H1', @ADMIN_ID_V10C, N'4월 중간 집계'),
    (@D_PURCH_V10,  2026, 3, 14400, 0, 0, 0, 0.000, 0.000,  8000000.00,  6200000.00, 'FCM-PUR-2026', NULL,           @CT1_ID_V10C,   N'구매 조달 안전교육 완료'),
    (@D_PURCH_V10,  2026, 4, 13600, 0, 0, 0, 0.000, 0.000,  8000000.00,  4100000.00, 'FCM-PUR-2026', NULL,           @CT1_ID_V10C,   N'PPE 입고 정상'),
    (@D_OPER_V10,   2026, 2, 22400, 1, 1, 0, 0.893, 0.893, 12000000.00, 10500000.00, 'FCM-OPR-2026', 'VBP-OPR-26H1', @CT2_ID_V10C,   N'운영팀 LTIR 발생'),
    (@D_OPER_V10,   2026, 3, 23200, 2, 1, 0, 1.724, 0.862, 12000000.00, 11300000.00, 'FCM-OPR-2026', 'VBP-OPR-26H1', @CT2_ID_V10C,   N'경미 2건'),
    (@D_OPER_V10,   2026, 4, 20800, 0, 0, 0, 0.000, 0.000, 12000000.00,  6800000.00, 'FCM-OPR-2026', 'VBP-OPR-26H1', @CT2_ID_V10C,   N'개선활동 효과'),
    (@D_VESSEL_V10, 2026, 3, 18400, 1, 0, 0, 1.087, 0.000, 18000000.00, 16400000.00, 'FCM-VSL-2026', 'VBP-VSL-26H1', @CT3_ID_V10C,   N'선박관리 경미 1건'),
    (@D_VESSEL_V10, 2026, 4, 17200, 1, 1, 0, 1.163, 1.163, 18000000.00,  9500000.00, 'FCM-VSL-2026', 'VBP-VSL-26H1', @CT3_ID_V10C,   N'추락 사고 1건'),
    (@D_SALES_V10,  2026, 3, 11200, 0, 0, 0, 0.000, 0.000,  5000000.00,  3200000.00, NULL,           NULL,           @ADMIN_ID_V10C, N'영업팀 무재해'),
    (@D_SALES_V10,  2026, 4, 10800, 0, 0, 0, 0.000, 0.000,  5000000.00,  1800000.00, NULL,           NULL,           @ADMIN_ID_V10C, N'4월 중간 집계');
END;
GO

-- 4. tb_safety_performance_sea
IF NOT EXISTS (SELECT 1 FROM tb_safety_performance_sea)
BEGIN
DECLARE @U_ADMIN_SEA BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @U_CT3_SEA   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');
DECLARE @VS_BONA      BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V001');
DECLARE @VS_TAEAN     BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V002');
DECLARE @VS_VISION    BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V003');
DECLARE @VS_CLIPPER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V004');
DECLARE @VS_HARMONY   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V005');
DECLARE @VS_PIONEER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V006');
DECLARE @VS_VICTORY   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V007');
DECLARE @VS_DILIGENCE BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V008');

INSERT INTO tb_safety_performance_sea (vessel_id, period_year, period_month, crew_count, illness_count, injury_count, evacuation_count, sick_leave_days, pos_sm_synced_at, excel_upload_id, uploaded_by, comment)
VALUES
    (@VS_BONA,      2026, 3, 24, 1, 0, 0,  3, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V001', @U_ADMIN_SEA, N'3월 정기 항해, 감기 1건'),
    (@VS_TAEAN,     2026, 3, 22, 0, 1, 0,  5, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V002', @U_ADMIN_SEA, N'갑판수 부상 1건'),
    (@VS_VISION,    2026, 3, 20, 0, 0, 0,  0, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V003', @U_ADMIN_SEA, N'무재해'),
    (@VS_CLIPPER,   2026, 3, 23, 1, 1, 1, 12, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V004', @U_ADMIN_SEA, N'조리장 심혈관 하선'),
    (@VS_HARMONY,   2026, 3, 18, 0, 0, 0,  0, NULL,                                'EXCEL-2026M03-V005', @U_CT3_SEA,   N'드라이독 중'),
    (@VS_PIONEER,   2026, 3, 21, 2, 0, 0,  7, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V006', @U_CT3_SEA,   N'독감 2건'),
    (@VS_VICTORY,   2026, 3, 19, 0, 0, 0,  0, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V007', @U_CT3_SEA,   N'무재해'),
    (@VS_DILIGENCE, 2026, 3, 22, 0, 1, 0,  4, DATEADD(day, -18, SYSUTCDATETIME()), 'EXCEL-2026M03-V008', @U_CT3_SEA,   N'기관수 경미 부상'),
    (@VS_BONA,      2026, 4, 24, 0, 0, 0,  0, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V001', @U_ADMIN_SEA, N'4월 무재해'),
    (@VS_TAEAN,     2026, 4, 22, 1, 0, 0,  3, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V002', @U_ADMIN_SEA, N'감기 1건'),
    (@VS_VISION,    2026, 4, 20, 0, 0, 0,  0, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V003', @U_ADMIN_SEA, N'무재해'),
    (@VS_CLIPPER,   2026, 4, 23, 0, 1, 0, 14, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V004', @U_ADMIN_SEA, N'용접 화상 1건'),
    (@VS_HARMONY,   2026, 4, 18, 0, 0, 0,  0, NULL,                                'EXCEL-2026M04-V005', @U_CT3_SEA,   N'드라이독 연장'),
    (@VS_PIONEER,   2026, 4, 21, 1, 0, 0,  4, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V006', @U_CT3_SEA,   N'위장염 1건'),
    (@VS_VICTORY,   2026, 4, 19, 0, 0, 0,  0, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V007', @U_CT3_SEA,   N'무재해'),
    (@VS_DILIGENCE, 2026, 4, 22, 0, 1, 1,  8, DATEADD(day, -2,  SYSUTCDATETIME()), 'EXCEL-2026M04-V008', @U_CT3_SEA,   N'갑판장 낙상 하선');
END;
GO

-- 5. tb_sea_crew_incident
IF NOT EXISTS (SELECT 1 FROM tb_sea_crew_incident)
BEGIN
DECLARE @VC_BONA      BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V001');
DECLARE @VC_TAEAN     BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V002');
DECLARE @VC_CLIPPER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V004');
DECLARE @VC_PIONEER   BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V006');
DECLARE @VC_DILIGENCE BIGINT = (SELECT id FROM tb_vessel WHERE code = 'PO-V008');

INSERT INTO tb_sea_crew_incident (vessel_id, period_year, period_month, crew_name, crew_role, incident_type, incident_date, diagnosis, evacuation_required, return_to_duty_date, excel_upload_id)
VALUES
    (@VC_BONA,      2026, 3, N'김갑판', N'갑판수',  'ILLNESS', '2026-03-12', N'감기몸살',              0, '2026-03-15', 'EXCEL-2026M03-V001'),
    (@VC_TAEAN,     2026, 3, N'이기관', N'기관수',  'INJURY',  '2026-03-18', N'좌측 발등 타박상',      0, '2026-03-22', 'EXCEL-2026M03-V002'),
    (@VC_CLIPPER,   2026, 3, N'박조리', N'조리장',  'ILLNESS', '2026-03-05', N'고혈압 악화',           1, NULL,         'EXCEL-2026M03-V004'),
    (@VC_CLIPPER,   2026, 3, N'최선장', N'선장',    'INJURY',  '2026-03-24', N'우측 손목 염좌',        0, '2026-03-28', 'EXCEL-2026M03-V004'),
    (@VC_PIONEER,   2026, 3, N'한기관', N'기관장',  'ILLNESS', '2026-03-09', N'독감 A형',              0, '2026-03-14', 'EXCEL-2026M03-V006'),
    (@VC_PIONEER,   2026, 3, N'조항해', N'항해사',  'ILLNESS', '2026-03-20', N'식중독',                0, '2026-03-23', 'EXCEL-2026M03-V006'),
    (@VC_TAEAN,     2026, 4, N'강갑판', N'갑판수',  'ILLNESS', '2026-04-02', N'장염',                  0, '2026-04-05', 'EXCEL-2026M04-V002'),
    (@VC_CLIPPER,   2026, 4, N'윤용접', N'용접사',  'INJURY',  '2026-04-05', N'우측 팔뚝 2도 화상',    0, NULL,         'EXCEL-2026M04-V004'),
    (@VC_PIONEER,   2026, 4, N'서조기', N'조기수',  'ILLNESS', '2026-04-11', N'위장염',                0, '2026-04-15', 'EXCEL-2026M04-V006'),
    (@VC_DILIGENCE, 2026, 4, N'정갑판', N'갑판장',  'INJURY',  '2026-04-14', N'계단 낙상 요추 염좌',   1, NULL,         'EXCEL-2026M04-V008');
END;
GO


-- =====================================================================
-- [MIGRATION V11]  V11__phase6_schema.sql
-- Phase 6: 보건 / 공지 / 양식함 / 업종별 안전수칙 / 감사점검
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- tb_health_checkup
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_health_checkup')
BEGIN
    CREATE TABLE tb_health_checkup (
        id                BIGINT         IDENTITY(1,1) NOT NULL,
        user_id           BIGINT         NOT NULL,
        company_id        BIGINT         NULL,
        checkup_date      DATE           NOT NULL,
        hospital_name     NVARCHAR(200)  NULL,
        checkup_type      VARCHAR(30)    NOT NULL DEFAULT 'GENERAL',
        summary           NVARCHAR(MAX)  NULL,
        report_file_url   NVARCHAR(500)  NULL,
        uploaded_by       BIGINT         NULL,
        uploaded_at       DATETIME2      NULL,
        created_at        DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at        DATETIME2      NULL,
        deleted           BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_health_checkup              PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_tb_health_checkup_type         CHECK (checkup_type IN ('GENERAL','SPECIAL','PRE_EMPLOYMENT')),
        CONSTRAINT FK_health_checkup_user            FOREIGN KEY (user_id)     REFERENCES tb_user(id),
        CONSTRAINT FK_health_checkup_company         FOREIGN KEY (company_id)  REFERENCES tb_company(id),
        CONSTRAINT FK_health_checkup_uploader        FOREIGN KEY (uploaded_by) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'건강검진 기록. checkup_type: GENERAL/SPECIAL/PRE_EMPLOYMENT.', 'SCHEMA', 'dbo', 'TABLE', 'tb_health_checkup';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_health_checkup_user_date')
    CREATE INDEX IX_tb_health_checkup_user_date ON tb_health_checkup(user_id, checkup_date DESC);
GO

-- tb_health_vital
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_health_vital')
BEGIN
    CREATE TABLE tb_health_vital (
        id                  BIGINT         IDENTITY(1,1) NOT NULL,
        checkup_id          BIGINT         NOT NULL,
        user_id             BIGINT         NOT NULL,
        measured_date       DATE           NOT NULL,
        systolic_bp         INT            NULL,
        diastolic_bp        INT            NULL,
        fasting_glucose     INT            NULL,
        hba1c               DECIMAL(4,2)   NULL,
        total_cholesterol   INT            NULL,
        ldl                 INT            NULL,
        hdl                 INT            NULL,
        triglyceride        INT            NULL,
        bmi                 DECIMAL(4,2)   NULL,
        waist_cm            DECIMAL(5,2)   NULL,
        smoking             BIT            NOT NULL DEFAULT 0,
        drinking_per_week   INT            NULL,
        is_hypertension     BIT            NOT NULL DEFAULT 0,
        is_diabetes         BIT            NOT NULL DEFAULT 0,
        is_dyslipidemia     BIT            NOT NULL DEFAULT 0,
        created_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2      NULL,
        deleted             BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_health_vital         PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_health_vital_checkup    FOREIGN KEY (checkup_id) REFERENCES tb_health_checkup(id) ON DELETE CASCADE,
        CONSTRAINT FK_health_vital_user       FOREIGN KEY (user_id)    REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'건강 수치 측정값. 고혈압/당뇨/고지혈증 3개년 추이 차트용.', 'SCHEMA', 'dbo', 'TABLE', 'tb_health_vital';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_health_vital_user_date')
    CREATE INDEX IX_tb_health_vital_user_date    ON tb_health_vital(user_id, measured_date DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_health_vital_hypertension')
    CREATE INDEX IX_tb_health_vital_hypertension ON tb_health_vital(is_hypertension);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_health_vital_diabetes')
    CREATE INDEX IX_tb_health_vital_diabetes     ON tb_health_vital(is_diabetes);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_health_vital_dyslipidemia')
    CREATE INDEX IX_tb_health_vital_dyslipidemia ON tb_health_vital(is_dyslipidemia);
GO

-- tb_health_consultation
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_health_consultation')
BEGIN
    CREATE TABLE tb_health_consultation (
        id                  BIGINT         IDENTITY(1,1) NOT NULL,
        user_id             BIGINT         NOT NULL,
        consultation_date   DATE           NOT NULL,
        consultant_name     NVARCHAR(100)  NULL,
        topic               NVARCHAR(200)  NULL,
        content             NVARCHAR(2000) NULL,
        action_items        NVARCHAR(2000) NULL,
        created_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2      NULL,
        deleted             BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_health_consultation    PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_health_consultation_user  FOREIGN KEY (user_id) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'보건 상담 이력 (개인별).', 'SCHEMA', 'dbo', 'TABLE', 'tb_health_consultation';
GO

-- tb_notice
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_notice')
BEGIN
    CREATE TABLE tb_notice (
        id              BIGINT         IDENTITY(1,1) NOT NULL,
        category        VARCHAR(30)    NOT NULL DEFAULT 'NOTICE',
        title           NVARCHAR(500)  NOT NULL,
        content         NVARCHAR(MAX)  NULL,
        author_user_id  BIGINT         NOT NULL,
        published_at    DATETIME2      NULL,
        pinned          BIT            NOT NULL DEFAULT 0,
        view_count      INT            NOT NULL DEFAULT 0,
        target_roles    VARCHAR(200)   NULL,
        expires_at      DATETIME2      NULL,
        created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2      NULL,
        deleted         BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_notice               PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_tb_notice_category      CHECK (category IN ('NOTICE','ANNOUNCEMENT','URGENT')),
        CONSTRAINT FK_notice_author           FOREIGN KEY (author_user_id) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'공지사항. category: NOTICE/ANNOUNCEMENT/URGENT. target_roles(CSV) NULL=전체.', 'SCHEMA', 'dbo', 'TABLE', 'tb_notice';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_notice_pinned_published')
    CREATE INDEX IX_tb_notice_pinned_published ON tb_notice(pinned DESC, published_at DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_notice_category')
    CREATE INDEX IX_tb_notice_category ON tb_notice(category);
GO

-- tb_form_template
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_form_template')
BEGIN
    CREATE TABLE tb_form_template (
        id              BIGINT         IDENTITY(1,1) NOT NULL,
        code            VARCHAR(50)    NOT NULL,
        category        NVARCHAR(50)   NOT NULL,
        title           NVARCHAR(300)  NOT NULL,
        description     NVARCHAR(1000) NULL,
        file_name       NVARCHAR(500)  NOT NULL,
        file_path       NVARCHAR(1000) NOT NULL,
        file_size       BIGINT         NULL,
        mime_type       VARCHAR(100)   NULL,
        version         VARCHAR(20)    NULL,
        download_count  INT            NOT NULL DEFAULT 0,
        uploaded_by     BIGINT         NOT NULL,
        active          BIT            NOT NULL DEFAULT 1,
        created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2      NULL,
        deleted         BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_form_template          PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_form_template_code     UNIQUE (code),
        CONSTRAINT FK_form_template_uploader    FOREIGN KEY (uploaded_by) REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'양식함 템플릿 (위험성평가·재해조사표 등). code UNIQUE.', 'SCHEMA', 'dbo', 'TABLE', 'tb_form_template';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_form_template_category_active')
    CREATE INDEX IX_tb_form_template_category_active ON tb_form_template(category, active);
GO

-- tb_safety_rule
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_safety_rule')
BEGIN
    CREATE TABLE tb_safety_rule (
        id              BIGINT         IDENTITY(1,1) NOT NULL,
        industry_code   VARCHAR(30)    NOT NULL,
        rule_no         VARCHAR(30)    NOT NULL,
        title           NVARCHAR(300)  NOT NULL,
        content         NVARCHAR(MAX)  NULL,
        severity        VARCHAR(20)    NOT NULL DEFAULT 'NORMAL',
        sort_order      INT            NOT NULL DEFAULT 0,
        active          BIT            NOT NULL DEFAULT 1,
        created_at      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at      DATETIME2      NULL,
        deleted         BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_safety_rule        PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_tb_safety_rule_no     UNIQUE (rule_no),
        CONSTRAINT CK_tb_safety_rule_sev    CHECK (severity IN ('NORMAL','CAUTION','WARNING','CRITICAL'))
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'업종별 안전수칙. industry_code -> tb_code(INDUSTRY). severity: NORMAL/CAUTION/WARNING/CRITICAL.', 'SCHEMA', 'dbo', 'TABLE', 'tb_safety_rule';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_safety_rule_industry_sort_active')
    CREATE INDEX IX_tb_safety_rule_industry_sort_active ON tb_safety_rule(industry_code, sort_order, active);
GO

-- tb_audit_inspection
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_audit_inspection')
BEGIN
    CREATE TABLE tb_audit_inspection (
        id                  BIGINT         IDENTITY(1,1) NOT NULL,
        inspection_type     VARCHAR(30)    NOT NULL,
        target_company_id   BIGINT         NULL,
        target_vessel_id    BIGINT         NULL,
        inspection_date     DATE           NOT NULL,
        inspector_user_id   BIGINT         NOT NULL,
        findings            NVARCHAR(MAX)  NULL,
        action_items        NVARCHAR(MAX)  NULL,
        status              VARCHAR(20)    NOT NULL DEFAULT 'OPEN',
        created_at          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
        updated_at          DATETIME2      NULL,
        deleted             BIT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_tb_audit_inspection           PRIMARY KEY CLUSTERED (id),
        CONSTRAINT CK_tb_audit_inspection_type      CHECK (inspection_type IN ('REGULAR','SPECIAL','FOLLOW_UP')),
        CONSTRAINT CK_tb_audit_inspection_status    CHECK (status IN ('OPEN','CLOSED')),
        CONSTRAINT FK_audit_inspection_company      FOREIGN KEY (target_company_id)  REFERENCES tb_company(id),
        CONSTRAINT FK_audit_inspection_vessel       FOREIGN KEY (target_vessel_id)   REFERENCES tb_vessel(id),
        CONSTRAINT FK_audit_inspection_inspector    FOREIGN KEY (inspector_user_id)  REFERENCES tb_user(id)
    );
END;
GO

EXEC sp_addextendedproperty 'MS_Description', N'정기 감사/점검 기록. inspection_type: REGULAR/SPECIAL/FOLLOW_UP.', 'SCHEMA', 'dbo', 'TABLE', 'tb_audit_inspection';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_audit_inspection_date_status')
    CREATE INDEX IX_tb_audit_inspection_date_status ON tb_audit_inspection(inspection_date DESC, status);
GO


-- =====================================================================
-- [MIGRATION V12]  V12__phase6_seed.sql
-- Phase 6 더미 시드
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- 1. tb_health_checkup
IF NOT EXISTS (SELECT 1 FROM tb_health_checkup)
BEGIN
DECLARE @ADMIN_ID_V12 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_ID_V12   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CT2_ID_V12   BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');
DECLARE @CO_DAEHAN_V12 BIGINT = (SELECT id FROM tb_company WHERE business_number = '111-11-11111');
DECLARE @CO_SEOUL_V12  BIGINT = (SELECT id FROM tb_company WHERE business_number = '222-22-22222');
DECLARE @NOW_V12 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_health_checkup (user_id, company_id, checkup_date, hospital_name, checkup_type, summary, report_file_url, uploaded_by, uploaded_at)
VALUES
    (@ADMIN_ID_V12, NULL,           DATEADD(day, -30,  @NOW_V12), N'서울대학교병원 강남센터', 'GENERAL',
     N'고혈압 관리 필요. 공복혈당 경계치. 생활습관 개선 권고.',
     N'/uploads/health/checkup/ADM-2026.pdf', @ADMIN_ID_V12, DATEADD(day, -30, @NOW_V12)),
    (@CT1_ID_V12,   @CO_DAEHAN_V12, DATEADD(day, -120, @NOW_V12), N'연세세브란스병원',        'GENERAL',
     N'전반적으로 양호. 총콜레스테롤 다소 높음. 재검 권고.',
     N'/uploads/health/checkup/CT1-2026.pdf', @ADMIN_ID_V12, DATEADD(day, -120, @NOW_V12)),
    (@CT2_ID_V12,   @CO_SEOUL_V12,  DATEADD(day, -60,  @NOW_V12), N'삼성서울병원',            'SPECIAL',
     N'특수검진(소음). 청력 정상. 고지혈증 지속 관리 필요.',
     N'/uploads/health/checkup/CT2-2026.pdf', @ADMIN_ID_V12, DATEADD(day, -60, @NOW_V12));
END;
GO

-- 2. tb_health_vital
IF NOT EXISTS (SELECT 1 FROM tb_health_vital)
BEGIN
DECLARE @ADMIN2_ID_V12 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_2_ID_V12  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CT2_2_ID_V12  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract2');
DECLARE @CK_ADMIN_V12  BIGINT = (SELECT TOP 1 id FROM tb_health_checkup WHERE user_id = @ADMIN2_ID_V12 ORDER BY id DESC);
DECLARE @CK_CT1_V12    BIGINT = (SELECT TOP 1 id FROM tb_health_checkup WHERE user_id = @CT1_2_ID_V12  ORDER BY id DESC);
DECLARE @CK_CT2_V12    BIGINT = (SELECT TOP 1 id FROM tb_health_checkup WHERE user_id = @CT2_2_ID_V12  ORDER BY id DESC);

INSERT INTO tb_health_vital (checkup_id, user_id, measured_date, systolic_bp, diastolic_bp, fasting_glucose, hba1c, total_cholesterol, ldl, hdl, triglyceride, bmi, waist_cm, smoking, drinking_per_week, is_hypertension, is_diabetes, is_dyslipidemia)
VALUES
    (@CK_ADMIN_V12, @ADMIN2_ID_V12, '2024-03-15', 128, 82,  98, 5.60, 198, 120, 52, 130, 24.50, 86.00, 0, 2, 0, 0, 0),
    (@CK_ADMIN_V12, @ADMIN2_ID_V12, '2025-03-18', 138, 88, 102, 5.80, 210, 128, 50, 145, 25.10, 88.50, 0, 3, 1, 0, 0),
    (@CK_ADMIN_V12, @ADMIN2_ID_V12, '2026-03-19', 146, 94, 108, 5.90, 218, 132, 48, 158, 25.80, 90.20, 0, 3, 1, 0, 1),
    (@CK_CT1_V12,   @CT1_2_ID_V12,  '2024-01-10', 122, 78, 108, 6.00, 232, 152, 42, 178, 26.20, 91.00, 1, 4, 0, 0, 1),
    (@CK_CT1_V12,   @CT1_2_ID_V12,  '2025-01-12', 126, 80, 118, 6.40, 245, 160, 40, 198, 26.80, 92.50, 1, 4, 0, 1, 1),
    (@CK_CT1_V12,   @CT1_2_ID_V12,  '2026-01-14', 130, 82, 132, 7.10, 258, 170, 38, 220, 27.40, 94.00, 1, 5, 1, 1, 1),
    (@CK_CT2_V12,   @CT2_2_ID_V12,  '2024-06-05', 118, 76,  94, 5.50, 248, 165, 46, 188, 25.00, 85.50, 0, 2, 0, 0, 1),
    (@CK_CT2_V12,   @CT2_2_ID_V12,  '2025-06-06', 120, 78,  96, 5.60, 235, 155, 48, 172, 24.70, 84.80, 0, 2, 0, 0, 1),
    (@CK_CT2_V12,   @CT2_2_ID_V12,  '2026-02-17', 118, 76,  92, 5.40, 210, 138, 50, 150, 24.30, 83.50, 0, 1, 0, 0, 1);
END;
GO

-- 3. tb_health_consultation
IF NOT EXISTS (SELECT 1 FROM tb_health_consultation)
BEGIN
DECLARE @ADMIN3_ID_V12 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_3_ID_V12  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @NOW3_V12 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_health_consultation (user_id, consultation_date, consultant_name, topic, content, action_items)
VALUES
    (@ADMIN3_ID_V12, DATEADD(day, -25, @NOW3_V12), N'김보건 (산업보건의)', N'혈압 관리 상담',
     N'최근 검진 결과 수축기 146/이완기 94. 염분 섭취 과다 의심. 스트레스 높음.',
     N'1) 저염식 식단 주 5회 이상  2) 유산소 운동 주 3회 30분 이상  3) 3개월 후 재측정'),
    (@CT1_3_ID_V12,  DATEADD(day, -40, @NOW3_V12), N'이영양 (영양사)',     N'당뇨 전단계 식이 상담',
     N'HbA1c 7.1로 당뇨 확진 경계. 탄수화물 과다. 야식 습관 확인.',
     N'1) 정제 탄수화물 감량  2) 야식 금지  3) 내분비내과 진료 예약  4) 1개월 내 재상담');
END;
GO

-- 4. tb_notice
IF NOT EXISTS (SELECT 1 FROM tb_notice)
BEGIN
DECLARE @ADMIN4_ID_V12 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT3_4_ID_V12  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract3');
DECLARE @NOW4_V12 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_notice (category, title, content, author_user_id, published_at, pinned, view_count, target_roles, expires_at)
VALUES
    ('URGENT',       N'[긴급] 4월 특별 안전점검 주간 시행 안내',
     N'4월 20일부터 26일까지 전사 특별 안전점검 주간을 시행합니다. 모든 협력사는 체크리스트를 사전 작성 후 제출 바랍니다.',
     @ADMIN4_ID_V12, DATEADD(day, -3, @NOW4_V12), 1, 248, 'ADMIN,CONTRACTOR,CONTRACT_DEPT', DATEADD(day, 10, @NOW4_V12)),
    ('ANNOUNCEMENT', N'2026년 상반기 정기 안전교육 일정 공지',
     N'상반기 안전교육이 5월 둘째 주에 진행됩니다. 온라인/오프라인 중 선택 수강 가능합니다.',
     @ADMIN4_ID_V12, DATEADD(day, -10, @NOW4_V12), 0, 187, 'CONTRACTOR,CONTRACT_DEPT', DATEADD(day, 30, @NOW4_V12)),
    ('NOTICE',       N'신규 재해조사표 양식(v2.1) 배포 안내',
     N'재해조사표 양식이 v2.1로 개정되었습니다. 양식함에서 다운로드 후 사용하시기 바랍니다.',
     @ADMIN4_ID_V12, DATEADD(day, -15, @NOW4_V12), 0, 134, NULL, NULL),
    ('NOTICE',       N'포털 시스템 정기 점검 안내 (4/22 02:00-04:00)',
     N'시스템 안정화를 위해 4월 22일 새벽 2시부터 4시까지 서비스 이용이 중단됩니다.',
     @CT3_4_ID_V12,  DATEADD(day, -5, @NOW4_V12),  0,  96, NULL, DATEADD(day, 5, @NOW4_V12)),
    ('ANNOUNCEMENT', N'근로자 의견조회 익명 제보 활성화 안내',
     N'모든 제보는 익명 처리가 가능하며, 담당 팀메일로 자동 통보됩니다. 안심하고 제보해 주세요.',
     @ADMIN4_ID_V12, DATEADD(day, -20, @NOW4_V12), 0,  72, 'CONTRACTOR', NULL);
END;
GO

-- 5. tb_form_template
IF NOT EXISTS (SELECT 1 FROM tb_form_template WHERE code = 'FORM-RA-001')
BEGIN
DECLARE @ADMIN5_ID_V12 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');

INSERT INTO tb_form_template (code, category, title, description, file_name, file_path, file_size, mime_type, version, download_count, uploaded_by, active)
VALUES
    ('FORM-RA-001', N'위험성평가', N'위험성평가표 (표준 양식)',
     N'작업 단위별 위험성 식별/평가/개선 기록 양식.',
     N'risk_assessment_v2.xlsx',   N'/uploads/forms/dummy-risk-assessment.pdf',
     184320, 'application/vnd.ms-excel', 'v2.0', 342, @ADMIN5_ID_V12, 1),
    ('FORM-AR-001', N'재해조사', N'재해조사표 (v2.1)',
     N'산업재해 발생 시 작성하는 공식 조사 양식. 사건 발생 24시간 내 제출.',
     N'accident_report_v2_1.docx', N'/uploads/forms/dummy-accident-report.pdf',
     156672, 'application/msword', 'v2.1', 128, @ADMIN5_ID_V12, 1),
    ('FORM-WP-001', N'작업계획', N'작업계획서 표준 양식',
     N'작업 착수 전 일정/인원/장비/위험요인 명시 작성.',
     N'work_plan_v1.docx',         N'/uploads/forms/dummy-work-plan.pdf',
     98304, 'application/msword', 'v1.3', 205, @ADMIN5_ID_V12, 1),
    ('FORM-SP-001', N'안전서약', N'안전서약서',
     N'신규 배정 인원의 안전수칙 이수 및 준수 서약.',
     N'safety_pledge_v1.pdf',      N'/uploads/forms/dummy-safety-pledge.pdf',
     52428, 'application/pdf', 'v1.0', 512, @ADMIN5_ID_V12, 1),
    ('FORM-CL-001', N'점검리스트', N'작업 전 체크리스트 (공통)',
     N'일일 작업 착수 전 안전 점검 리스트. 팀장 서명 필수.',
     N'pre_work_checklist.pdf',    N'/uploads/forms/dummy-checklist.pdf',
     32768, 'application/pdf', 'v1.1', 284, @ADMIN5_ID_V12, 1),
    ('FORM-HC-001', N'보건', N'건강설문지 (연간)',
     N'연 1회 건강 관련 자가 진단 설문.',
     N'health_survey_2026.pdf',    N'/uploads/forms/dummy-health-survey.pdf',
     41984, 'application/pdf', 'v2026', 67, @ADMIN5_ID_V12, 1);
END;
GO

-- 6. tb_safety_rule
IF NOT EXISTS (SELECT 1 FROM tb_safety_rule WHERE rule_no = 'SR-INS-001')
INSERT INTO tb_safety_rule (industry_code, rule_no, title, content, severity, sort_order, active)
VALUES
    ('INSPECTION',  'SR-INS-001', N'고소작업 시 안전벨트 착용 필수',         N'2m 이상 높이에서 검수 작업 시 안전벨트 후크 결속을 반드시 확인한다.',    'CRITICAL', 10, 1),
    ('INSPECTION',  'SR-INS-002', N'홀드 진입 전 가스 측정 의무',             N'화물 홀드 진입 전 산소·유독가스 측정을 실시하고, 결과를 기록한다.',       'WARNING',  20, 1),
    ('INSPECTION',  'SR-INS-003', N'야간 검수 조명 확보',                     N'야간 검수 시 luxmeter 기준 200lux 이상 조명을 확보하고 보조 조명을 휴대.', 'CAUTION',  30, 1),
    ('LASHING',     'SR-LSH-001', N'크레인 하부 출입금지',                    N'크레인 작업 반경 및 하부 통로 절대 출입금지. 위반 시 즉시 작업 중단.',     'CRITICAL', 10, 1),
    ('LASHING',     'SR-LSH-002', N'고박 장비 일일 점검',                     N'래싱 체인/터버클/파이프의 균열·변형·부식을 매일 점검하고 점검일지에 기록.', 'WARNING',  20, 1),
    ('LASHING',     'SR-LSH-003', N'고박 작업 2인 1조 원칙',                  N'선상 래싱 작업은 반드시 2인 1조로 수행하며 상호 안전 확인.',               'WARNING',  30, 1),
    ('STEVEDORING', 'SR-STV-001', N'지게차 작업 반경 내 보행 금지',           N'지게차 작업 반경 5m 내 보행 금지. 보행로는 노란색 선으로 명확히 구분.',    'CRITICAL', 10, 1),
    ('STEVEDORING', 'SR-STV-002', N'하역 작업 전 바닥 상태 확인',             N'갑판 및 부두 바닥의 수분/기름/이물질을 제거한 후 작업 착수.',              'CAUTION',  20, 1),
    ('STEVEDORING', 'SR-STV-003', N'컨테이너 적재 한도 준수',                 N'컨테이너 적재 단수 및 중량 한도를 초과하지 않으며, 고박 상태 점검.',       'WARNING',  30, 1),
    ('SURVEY',      'SR-SVY-001', N'계측기 영점 확인',                        N'작업 착수 전 계측기 영점/교정 상태를 확인하고 기록지에 서명.',              'CAUTION',  10, 1),
    ('SURVEY',      'SR-SVY-002', N'밀폐공간 진입 허가제',                    N'탱크·홀드 등 밀폐공간은 진입 허가서 발급 후 진입.',                        'CRITICAL', 20, 1),
    ('SHIP_SUPPLY', 'SR-SUP-001', N'중량물 취급 허리 보호',                   N'20kg 이상 중량물은 2인 1조 또는 보조기구 사용. 허리 보호대 착용.',         'WARNING',  10, 1),
    ('SHIP_SUPPLY', 'SR-SUP-002', N'위험물 라벨 확인',                        N'공급품 인도 시 MSDS/라벨 일치 여부 확인 후 전달.',                         'CAUTION',  20, 1),
    ('REPAIR',      'SR-RPR-001', N'LOTO (Lock-Out Tag-Out) 의무',           N'전기·기계 수리 시 에너지원 차단 후 잠금 및 태그 부착.',                    'CRITICAL', 10, 1),
    ('REPAIR',      'SR-RPR-002', N'고소 작업대 사전 점검',                   N'작업대·사다리 상태 점검 후 사용. 3m 이상 고소 시 안전벨트 착용.',          'WARNING',  20, 1),
    ('REPAIR',      'SR-RPR-003', N'수공구 전용 홀스터 사용',                 N'낙하 방지를 위해 수공구는 전용 홀스터/랜야드에 결속.',                      'CAUTION',  30, 1),
    ('PAINTING',    'SR-PNT-001', N'유기용제 취급 시 환기',                   N'밀폐공간 도장 시 강제 환기(송풍 5회/시간 이상) 및 방독 마스크 착용.',       'CRITICAL', 10, 1),
    ('PAINTING',    'SR-PNT-002', N'정전기 방지 조치',                        N'용제 작업 구역은 본딩/접지하여 정전기 점화 위험을 제거한다.',               'WARNING',  20, 1),
    ('WELDING',     'SR-WLD-001', N'화재 감시자 배치 필수',                   N'용접·용단 작업 시 화재 감시자 1명 배치, 소화기 비치, 작업 종료 30분 후까지 감시.', 'CRITICAL', 10, 1),
    ('WELDING',     'SR-WLD-002', N'보호구 완전 착용',                        N'용접면·내열 장갑·작업복 소매/바짓단 여밈 확인. 불꽃이 튀지 않도록 복장 점검.', 'WARNING', 20, 1);
GO

-- 7. tb_audit_inspection
IF NOT EXISTS (SELECT 1 FROM tb_audit_inspection)
BEGIN
DECLARE @ADMIN7_ID_V12 BIGINT = (SELECT id FROM tb_user WHERE username = 'admin');
DECLARE @CT1_7_ID_V12  BIGINT = (SELECT id FROM tb_user WHERE username = 'contract1');
DECLARE @CO_BUSAN7_V12   BIGINT = (SELECT id FROM tb_company WHERE business_number = '333-33-33333');
DECLARE @CO_HANBIT7_V12  BIGINT = (SELECT id FROM tb_company WHERE business_number = '777-77-77777');
DECLARE @V_BONA7_V12     BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V001');
DECLARE @V_CLIPPER7_V12  BIGINT = (SELECT id FROM tb_vessel  WHERE code = 'PO-V004');
DECLARE @NOW7_V12 DATETIME2 = SYSUTCDATETIME();

INSERT INTO tb_audit_inspection (inspection_type, target_company_id, target_vessel_id, inspection_date, inspector_user_id, findings, action_items, status)
VALUES
    ('REGULAR',   @CO_BUSAN7_V12,  NULL,              DATEADD(day, -45, @NOW7_V12),
     @ADMIN7_ID_V12,
     N'부산하역 4부두 정기 감사. 보행로 구획선 일부 마모. PPE 비치함 관리 양호.',
     N'1) 보행로 라인 재도색 (5/15까지) 2) 지게차 후진 경고음 점검', 'CLOSED'),
    ('REGULAR',   NULL,            @V_BONA7_V12,      DATEADD(day, -14, @NOW7_V12),
     @CT1_7_ID_V12,
     N'PAN BONA 승선 점검. 소화기 유효기간 2개 만료. 구명조끼 상태 양호.',
     N'1) 소화기 2개 교체  2) 승선자 안전교육 기록 업데이트', 'OPEN'),
    ('FOLLOW_UP', @CO_HANBIT7_V12, @V_CLIPPER7_V12,   DATEADD(day, -5,  @NOW7_V12),
     @ADMIN7_ID_V12,
     N'4/5 용접 화상 사고 후속점검. 보호구 교체 완료. 재발방지 교육 이수 확인.',
     N'1) 월 1회 PPE 점검 정례화  2) 용접 화재 감시자 배치 철저', 'OPEN');
END;
GO


-- =====================================================================
-- [MIGRATION V13]  V13__phase7_check_by_ship.sql
-- Phase 7: 방문허가서 작업자별 "Check by ship" 컬럼 추가
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


-- =====================================================================
-- [MIGRATION V14]  V14__phase7_evaluation_history.sql
-- Phase 7: 협력업체 안전보건평가 수정 이력 테이블
-- =====================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tb_evaluation_history')
BEGIN
    CREATE TABLE dbo.tb_evaluation_history (
        id             BIGINT        IDENTITY(1,1) NOT NULL,
        evaluation_id  BIGINT        NOT NULL,
        improvement_id BIGINT        NULL,
        action         VARCHAR(50)   NOT NULL,
        actor_user_id  BIGINT        NULL,
        actor_name     NVARCHAR(100) NULL,
        detail         NVARCHAR(MAX) NULL,
        created_at     DATETIME2(3)  NOT NULL CONSTRAINT DF_tb_evaluation_history_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tb_evaluation_history PRIMARY KEY CLUSTERED (id)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_history_eval')
    CREATE INDEX IX_tb_evaluation_history_eval ON dbo.tb_evaluation_history(evaluation_id, created_at DESC);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_tb_evaluation_history_imp')
    CREATE INDEX IX_tb_evaluation_history_imp ON dbo.tb_evaluation_history(improvement_id)
        WHERE improvement_id IS NOT NULL;
GO


-- =====================================================================
-- [MIGRATION V15]  V15__phase7_item_score_na.sql
-- Phase 7: 평가 항목별 "자료없음(N/A)" 체크 컬럼 추가
-- =====================================================================

IF COL_LENGTH('dbo.tb_evaluation_item_score', 'not_applicable') IS NULL
BEGIN
    ALTER TABLE dbo.tb_evaluation_item_score
        ADD not_applicable BIT NOT NULL CONSTRAINT DF_tb_evaluation_item_score_na DEFAULT 0;
END
GO


-- =====================================================================
-- [MIGRATION V16]  V16__phase7_register_fields.sql
-- Phase 7: 회원가입 확장 필드 (tb_company / tb_user)
-- =====================================================================

IF COL_LENGTH('dbo.tb_company', 'name_en') IS NULL
    ALTER TABLE dbo.tb_company ADD name_en NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.tb_company', 'postal_code') IS NULL
    ALTER TABLE dbo.tb_company ADD postal_code VARCHAR(10) NULL;
GO

IF COL_LENGTH('dbo.tb_company', 'address_detail') IS NULL
    ALTER TABLE dbo.tb_company ADD address_detail NVARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.tb_company', 'business_license_file_path') IS NULL
    ALTER TABLE dbo.tb_company ADD business_license_file_path NVARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.tb_company', 'industry_other') IS NULL
    ALTER TABLE dbo.tb_company ADD industry_other NVARCHAR(200) NULL;
GO

IF COL_LENGTH('dbo.tb_user', 'title') IS NULL
    ALTER TABLE dbo.tb_user ADD title NVARCHAR(50) NULL;
GO


-- =====================================================================
-- [MIGRATION V17]  V17__phase7_audit_closed_at.sql
-- Phase 7: tb_audit_inspection에 closed_at 컬럼 추가
-- =====================================================================

IF COL_LENGTH('dbo.tb_audit_inspection', 'closed_at') IS NULL
BEGIN
    ALTER TABLE dbo.tb_audit_inspection
        ADD closed_at DATETIME2(3) NULL;
END
GO


-- =====================================================================
-- [MIGRATION V18]  V18__add_safety_manager_to_access_request.sql
-- PPT 슬라이드 14: 안전담당자 컬럼 추가
-- =====================================================================

IF COL_LENGTH('dbo.tb_access_request', 'safety_manager_name') IS NULL
    ALTER TABLE tb_access_request
        ADD safety_manager_name  NVARCHAR(100) NULL,
            safety_manager_tel   NVARCHAR(50)  NULL,
            safety_manager_email NVARCHAR(200) NULL;
GO


-- =====================================================================
-- [MIGRATION V19]  V19__update_evaluation_items_ppt20.sql
-- PPT 슬라이드 20 기준 평가 항목 전체 교체 (14개 → 21개)
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- 1. FK 참조 정리 (기존 시드 항목 참조 해제)
UPDATE tb_evaluation_improvement SET item_id = NULL WHERE item_id IS NOT NULL;
GO

UPDATE tb_evaluation_attachment SET item_id = NULL WHERE item_id IS NOT NULL;
GO

DELETE FROM tb_evaluation_item_score;
GO

DELETE FROM tb_evaluation_item;
GO

-- 2. PPT 슬라이드 20 기준 21개 항목 삽입
INSERT INTO tb_evaluation_item (code, category, title, description, max_score, weight, sort_order, active)
VALUES
    -- ■ 안전보건 관리체계 (20점)
    ('GENERAL_PRINCIPLE',  N'안전보건 관리체계', N'일반원칙',      N'안전보건방침 적정 여부',                                              5,  1.00,  1, 1),
    ('PLAN_ESTABLISH',     N'안전보건 관리체계', N'계획수립',      N'산업재해예방 활동에 대한 수급인의 이행계획 적정 여부',                  10, 1.00,  2, 1),
    ('STRUCTURE_DUTY',     N'안전보건 관리체계', N'구조 및 책임',  N'이행계획 추진을 위한 구성원의 역할 분담',                              5,  1.00,  3, 1),
    -- ■ 실행수준 (35점)
    ('RISK_ASSESSMENT',    N'실행수준', N'위험성평가',             N'도급작업의 위험성평가 결과에 대한 이해수준 및 자체 유해·위험요인 평가',  5,  1.00,  4, 1),
    ('SAFETY_INSPECTION',  N'실행수준', N'안전점검',               N'안전점검 및 모니터링 (보호구 착용확인 포함)',                           10, 1.00,  5, 1),
    ('COMPLIANCE_CHECK',   N'실행수준', N'이행확인',               N'안전조치 이행여부 확인 (도급업체의 지도조언에 대한 이행 포함)',           10, 1.00,  6, 1),
    ('EDUCATION_RECORD',   N'실행수준', N'교육 및 기록',           N'안전보건 교육 계획 및 기록관리',                                       5,  1.00,  7, 1),
    ('WORK_PERMIT',        N'실행수준', N'안전작업 허가',          N'유해·위험작업에 대한 안전작업허가 이행수준',                            5,  1.00,  8, 1),
    -- ■ 운영관리 (25점)
    ('SIGNAL_CONTACT',     N'운영관리', N'신호 및 연락체계',       N'도급/수급업체 간 신호/연락 체계',                                      5,  1.00,  9, 1),
    ('HAZMAT_FACILITY',    N'운영관리', N'위험물질 및 설비',       N'유해·위험 물질 및 취급 기계·기구 및 설비의 안전성 확인',                10, 1.00, 10, 1),
    ('EMERGENCY_PLAN',     N'운영관리', N'비상대책',               N'비상시 대피 및 피해최소화대책 (고용부, 소방서, 병원 포함)',               10, 1.00, 11, 1),
    -- ■ 재해발생 수준 (15점)
    ('ACCIDENT_STATUS',    N'재해발생 수준', N'산업재해 현황',     N'최근 3년간 산업재해 발생 현황',                                        15, 1.00, 12, 1),
    -- ■ 법령위반 (5점)
    ('LAW_VIOLATION',      N'법령위반', N'법령위반',               N'최근 3년간 법령 위반 현황',                                            5,  1.00, 13, 1),
    -- ■ 추가 가산점항목 (10점)
    ('SAFETY_MGT_COST',    N'추가 가산점항목', N'산업안전보건관리비',    N'산업안전 보건관리비 계정 적용 여부',                            1,  1.00, 14, 1),
    ('SAFETY_REGULATION',  N'추가 가산점항목', N'안전보건관리규정',      N'안전보건관리 규정 보유/적용 여부',                              1,  1.00, 15, 1),
    ('SAFETY_MGMT_SYS',    N'추가 가산점항목', N'안전보건경영시스템',    N'ISO 45001 or KOSHA MS 등 인증 여부',                           2,  1.00, 16, 1),
    ('RISK_CERT',          N'추가 가산점항목', N'위험성평가 인증',       N'위험성평가 우수사업자 인증 여부',                               1,  1.00, 17, 1),
    ('PORT_AGREEMENT',     N'추가 가산점항목', N'항만운영협약',          N'해수부 항만운영협약 체결 대상자',                               2,  1.00, 18, 1),
    ('DISASTER_REDUCTION', N'추가 가산점항목', N'재해경감우수기업',      N'재해경감우수기업 인증 여부',                                    1,  1.00, 19, 1),
    ('HEALTH_PROMOTION',   N'추가 가산점항목', N'건강증진 우수사업장',   N'근로자 건강증진활동 우수 사업장 인증 여부',                     1,  1.00, 20, 1),
    ('EXTERNAL_AWARD',     N'추가 가산점항목', N'외부기관 포상',         N'안전보건 관련 정부협회 포상',                                   1,  1.00, 21, 1);
GO

-- 3. 기존 평가 건들에 새 항목 점수 재생성
DECLARE @evalId_V19 BIGINT, @status_V19 VARCHAR(20);

DECLARE eval_cursor_V19 CURSOR LOCAL FAST_FORWARD FOR
    SELECT id, status FROM tb_evaluation ORDER BY id;

OPEN eval_cursor_V19;
FETCH NEXT FROM eval_cursor_V19 INTO @evalId_V19, @status_V19;

WHILE @@FETCH_STATUS = 0
BEGIN
    INSERT INTO tb_evaluation_item_score (evaluation_id, item_id, score, max_score, weight, weighted_score, comment)
    SELECT @evalId_V19, i.id,
        CASE
            WHEN @status_V19 = 'DRAFT'     AND i.sort_order > 5  THEN NULL
            WHEN @status_V19 = 'DRAFT'                           THEN CAST(ROUND(i.max_score * 0.70, 0) AS DECIMAL(5,2))
            WHEN @status_V19 = 'SUBMITTED'                       THEN CAST(ROUND(i.max_score * 0.80, 0) AS DECIMAL(5,2))
            WHEN @status_V19 = 'APPROVED'                        THEN CAST(ROUND(i.max_score * 0.90, 0) AS DECIMAL(5,2))
            WHEN @status_V19 = 'REJECTED' AND i.category = N'재해발생 수준' THEN CAST(ROUND(i.max_score * 0.30, 0) AS DECIMAL(5,2))
            WHEN @status_V19 = 'REJECTED'                        THEN CAST(ROUND(i.max_score * 0.55, 0) AS DECIMAL(5,2))
        END AS score,
        CAST(i.max_score AS DECIMAL(5,2)), i.weight,
        CASE
            WHEN @status_V19 = 'DRAFT' AND i.sort_order > 5 THEN NULL
            ELSE CAST(ROUND(i.max_score * CASE
                WHEN @status_V19 = 'DRAFT'                                     THEN 0.70
                WHEN @status_V19 = 'SUBMITTED'                                 THEN 0.80
                WHEN @status_V19 = 'APPROVED'                                  THEN 0.90
                WHEN @status_V19 = 'REJECTED' AND i.category = N'재해발생 수준' THEN 0.30
                WHEN @status_V19 = 'REJECTED'                                  THEN 0.55
            END * i.weight, 2) AS DECIMAL(7,2))
        END AS weighted_score, NULL
    FROM tb_evaluation_item i WHERE i.active = 1 AND i.deleted = 0;

    FETCH NEXT FROM eval_cursor_V19 INTO @evalId_V19, @status_V19;
END;

CLOSE eval_cursor_V19;
DEALLOCATE eval_cursor_V19;
GO

-- 4. 평가 집계 재계산
UPDATE e
   SET total_score      = agg.total_weighted,
       max_total_score  = agg.max_weighted,
       score_percentage = CASE WHEN agg.max_weighted > 0 THEN CAST(agg.total_weighted * 100.0 / agg.max_weighted AS DECIMAL(5,2)) ELSE NULL END,
       qualified        = CASE WHEN agg.max_weighted > 0 AND (agg.total_weighted * 100.0 / agg.max_weighted) >= e.qualification_threshold THEN 1 ELSE 0 END,
       updated_at       = SYSUTCDATETIME()
  FROM tb_evaluation e
 CROSS APPLY (
        SELECT SUM(s.weighted_score) AS total_weighted, SUM(s.max_score * s.weight) AS max_weighted
          FROM tb_evaluation_item_score s
         WHERE s.evaluation_id = e.id AND s.score IS NOT NULL
 ) agg
 WHERE e.status <> 'DRAFT';
GO


-- =====================================================================
-- [MIGRATION V20]  V20__add_reference_doc_to_evaluation_item.sql
-- PPT 슬라이드 25: tb_evaluation_item에 참고서류(첨부파일) 컬럼 추가
-- =====================================================================

IF COL_LENGTH('dbo.tb_evaluation_item', 'reference_doc') IS NULL
BEGIN
    ALTER TABLE dbo.tb_evaluation_item ADD reference_doc NVARCHAR(500) NULL;
END
GO

UPDATE tb_evaluation_item SET reference_doc = N'안전보건 방침'                                         WHERE code = 'GENERAL_PRINCIPLE';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건관리계획서'                                    WHERE code = 'PLAN_ESTABLISH';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건 조직표'                                       WHERE code = 'STRUCTURE_DUTY';
UPDATE tb_evaluation_item SET reference_doc = N'위험성평가 (최신버전)'                                 WHERE code = 'RISK_ASSESSMENT';
UPDATE tb_evaluation_item SET reference_doc = N'TBM 교육자료 (최신버전)'                               WHERE code = 'SAFETY_INSPECTION';
UPDATE tb_evaluation_item SET reference_doc = N'도출된 유해위험 포인트 개선방안 합 적용 사례'          WHERE code = 'COMPLIANCE_CHECK';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건 교육 계획/기록부'                             WHERE code = 'EDUCATION_RECORD';
UPDATE tb_evaluation_item SET reference_doc = N'최근 작업허가서 샘플'                                  WHERE code = 'WORK_PERMIT';
UPDATE tb_evaluation_item SET reference_doc = N'비상연락망'                                            WHERE code = 'SIGNAL_CONTACT';
UPDATE tb_evaluation_item SET reference_doc = N'해당 기구 사용 지침서'                                 WHERE code = 'HAZMAT_FACILITY';
UPDATE tb_evaluation_item SET reference_doc = N'비상대응절차서'                                        WHERE code = 'EMERGENCY_PLAN';
UPDATE tb_evaluation_item SET reference_doc = N'1. 사업장산업재해율 소자표  2. 원인 및 재발방지 대책'  WHERE code = 'ACCIDENT_STATUS';
UPDATE tb_evaluation_item SET reference_doc = N'관련 증빙자료'                                         WHERE code = 'LAW_VIOLATION';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건관리비 집행 이력'                              WHERE code = 'SAFETY_MGT_COST';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건관리 규정'                                     WHERE code = 'SAFETY_REGULATION';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건경영시스템 인증서'                             WHERE code = 'SAFETY_MGMT_SYS';
UPDATE tb_evaluation_item SET reference_doc = N'우수사업자 인증 자료'                                  WHERE code = 'RISK_CERT';
UPDATE tb_evaluation_item SET reference_doc = N'체결 대상 동반자료'                                    WHERE code = 'PORT_AGREEMENT';
UPDATE tb_evaluation_item SET reference_doc = N'재해경감우수기업 인증 자료'                            WHERE code = 'DISASTER_REDUCTION';
UPDATE tb_evaluation_item SET reference_doc = N'증빙자료'                                              WHERE code = 'HEALTH_PROMOTION';
UPDATE tb_evaluation_item SET reference_doc = N'포상 자료'                                             WHERE code = 'EXTERNAL_AWARD';
GO


-- =====================================================================
-- 완료 메시지
-- =====================================================================
PRINT '================================================================';
PRINT ' PANOCEAN_EHS DB 전체 설정 완료 (V1 ~ V20)';
PRINT ' 생성된 주요 테이블:';
PRINT '  - 공통: tb_role, tb_code, tb_department, tb_company, tb_user';
PRINT '  - 공통: tb_vessel, tb_port, tb_user_department, tb_user_industry';
PRINT '  - 공통: tb_notification, tb_audit_log';
PRINT '  - Phase3: tb_access_request, tb_access_worker, tb_access_attachment';
PRINT '  - Phase3: tb_visit_permit, tb_access_review_log, tb_daily_safety_log';
PRINT '  - Phase4: tb_evaluation_item, tb_evaluation, tb_evaluation_item_score';
PRINT '  - Phase4: tb_evaluation_attachment, tb_evaluation_improvement';
PRINT '  - Phase4: tb_som_company_snapshot';
PRINT '  - Phase5: tb_worker_voice, tb_voice_attachment, tb_industrial_accident';
PRINT '  - Phase5: tb_safety_performance_land, tb_safety_performance_sea';
PRINT '  - Phase5: tb_sea_crew_incident';
PRINT '  - Phase6: tb_health_checkup, tb_health_vital, tb_health_consultation';
PRINT '  - Phase6: tb_notice, tb_form_template, tb_safety_rule, tb_audit_inspection';
PRINT '  - Phase7: tb_evaluation_history (V14)';
PRINT '';
PRINT ' 주의사항:';
PRINT '  - 운영 전 BCrypt 해시(password123) 반드시 교체';
PRINT '  - 운영 전 DB 계정 패스워드 반드시 교체';
PRINT '  - 모든 타임스탬프는 UTC 저장 (앱에서 KST 변환)';
PRINT '================================================================';
GO
