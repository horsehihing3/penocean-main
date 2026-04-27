-- =====================================================================
-- V1__init_common_schema.sql
-- 팬오션 안전보건 DX - Phase 1 공통 스키마
-- Target: MSSQL 2019+
--
-- Naming conventions
--  - tables: snake_case, prefix `tb_`
--  - PK    : id BIGINT IDENTITY(1,1)
--  - common: created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
--            updated_at DATETIME2 NULL,
--            deleted    BIT      NOT NULL DEFAULT 0
--  - FK    : FK_<childTable>_<parent>
--  - IX    : IX_<table>_<col1>[_<col2>]
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- tb_role : 사용자 역할 (ADMIN / CONTRACTOR / CONTRACT_DEPT)
-- =====================================================================
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

-- =====================================================================
-- tb_code : 공통 코드 마스터 (업종, 선박유형, 상태 등)
-- =====================================================================
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

CREATE INDEX IX_tb_code_group_active ON tb_code(group_code, active, sort_order);
GO

-- =====================================================================
-- tb_department : 계약부서 (자기 참조)
-- =====================================================================
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

-- =====================================================================
-- tb_company : 협력업체
-- =====================================================================
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

CREATE INDEX IX_tb_company_industry_status ON tb_company(industry_code, status);
GO

-- =====================================================================
-- tb_user : 포털 사용자
-- =====================================================================
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

CREATE INDEX IX_tb_user_email         ON tb_user(email);
GO
CREATE INDEX IX_tb_user_status_role   ON tb_user(status, role_code);
GO
CREATE INDEX IX_tb_user_company       ON tb_user(company_id) WHERE company_id IS NOT NULL;
GO
CREATE INDEX IX_tb_user_department    ON tb_user(department_id) WHERE department_id IS NOT NULL;
GO

-- 뒤늦게 tb_department.manager_user_id FK 추가 (tb_user 생성 이후)
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_department_manager')
    ALTER TABLE tb_department
        ADD CONSTRAINT FK_department_manager FOREIGN KEY (manager_user_id) REFERENCES tb_user(id);
GO

-- =====================================================================
-- tb_vessel : 선박 (= 사업장)
-- =====================================================================
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

CREATE INDEX IX_tb_vessel_name        ON tb_vessel(name);
GO
CREATE INDEX IX_tb_vessel_imo_number  ON tb_vessel(imo_number);
GO

-- =====================================================================
-- tb_port : 항구 마스터 (UN/LOCODE)
-- =====================================================================
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

-- =====================================================================
-- tb_user_department : 다대다 (user <-> department)
-- =====================================================================
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

-- =====================================================================
-- tb_user_industry : 다대다 (user <-> industry_code)
-- =====================================================================
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

-- =====================================================================
-- tb_notification : 알림 로그 (EMAIL / KAKAO / SYSTEM)
-- =====================================================================
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

CREATE INDEX IX_tb_notification_recipient_status ON tb_notification(recipient_user_id, status);
GO

-- =====================================================================
-- tb_audit_log : 감사 로그 (로그인, 가입, 승인 등)
-- =====================================================================
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

CREATE INDEX IX_tb_audit_log_user_action ON tb_audit_log(user_id, action, created_at DESC);
GO
CREATE INDEX IX_tb_audit_log_resource    ON tb_audit_log(resource_type, resource_id);
GO
