-- =====================================================================
-- V11__phase6_schema.sql
-- 팬오션 안전보건 DX - Phase 6 (마지막 단계)
--   보건(slide 31) / 공지(slide 21) / 양식함(slide 21) /
--   업종별 안전수칙(slide 27) / 감사점검(slide 22 연계)
-- Target: MSSQL 2019+
--
-- Conventions
--  - tables: snake_case, prefix `tb_`
--  - PK    : id BIGINT IDENTITY(1,1)
--  - common: created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
--            updated_at DATETIME2 NULL,
--            deleted    BIT      NOT NULL DEFAULT 0
--  - FK    : FK_<childTable>_<parent>
--  - IX    : IX_<table>_<col1>[_<col2>]
--
-- Key contracts
--  - checkup_type   : GENERAL / SPECIAL / PRE_EMPLOYMENT
--  - notice.category: NOTICE / ANNOUNCEMENT / URGENT
--  - notice.target_roles : comma-separated role codes; NULL = all
--  - safety_rule.severity: NORMAL / CAUTION / WARNING / CRITICAL
--  - audit.inspection_type: REGULAR / SPECIAL / FOLLOW_UP
--  - audit.status          : OPEN / CLOSED
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- tb_health_checkup : 건강검진 기록 (slide 31)
--   company_id NULL = 해상직원(본사 직접 관리)
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'건강검진 기록. checkup_type: GENERAL/SPECIAL/PRE_EMPLOYMENT. company_id NULL = 해상직원.', 'SCHEMA', 'dbo', 'TABLE', 'tb_health_checkup';
GO

CREATE INDEX IX_tb_health_checkup_user_date
    ON tb_health_checkup(user_id, checkup_date DESC);
GO

-- =====================================================================
-- tb_health_vital : 건강 수치 (고혈압/당뇨/고지혈증 3개년 추이)
--   checkup 삭제 시 CASCADE
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'건강 수치 측정값. 고혈압/당뇨/고지혈증 3개년 추이 차트용. 파생 플래그 포함.', 'SCHEMA', 'dbo', 'TABLE', 'tb_health_vital';
GO

CREATE INDEX IX_tb_health_vital_user_date
    ON tb_health_vital(user_id, measured_date DESC);
GO
CREATE INDEX IX_tb_health_vital_hypertension
    ON tb_health_vital(is_hypertension);
GO
CREATE INDEX IX_tb_health_vital_diabetes
    ON tb_health_vital(is_diabetes);
GO
CREATE INDEX IX_tb_health_vital_dyslipidemia
    ON tb_health_vital(is_dyslipidemia);
GO

-- =====================================================================
-- tb_health_consultation : 보건 상담 이력 (slide 31)
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'보건 상담 이력 (개인별). 주제/내용/조치사항.', 'SCHEMA', 'dbo', 'TABLE', 'tb_health_consultation';
GO

-- =====================================================================
-- tb_notice : 공지사항 (slide 21)
--   target_roles NULL = 전체
-- =====================================================================
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

CREATE INDEX IX_tb_notice_pinned_published
    ON tb_notice(pinned DESC, published_at DESC);
GO
CREATE INDEX IX_tb_notice_category
    ON tb_notice(category);
GO

-- =====================================================================
-- tb_form_template : 양식함 (위험성평가/재해조사표/작업계획 등) (slide 21)
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'양식함 템플릿 (위험성평가·재해조사표 등). code UNIQUE, version, download_count.', 'SCHEMA', 'dbo', 'TABLE', 'tb_form_template';
GO

CREATE INDEX IX_tb_form_template_category_active
    ON tb_form_template(category, active);
GO

-- =====================================================================
-- tb_safety_rule : 업종별 안전수칙 (slide 27)
--   industry_code references tb_code(group_code='INDUSTRY')
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'업종별 안전수칙. industry_code -> tb_code(INDUSTRY). severity: NORMAL/CAUTION/WARNING/CRITICAL. markdown content.', 'SCHEMA', 'dbo', 'TABLE', 'tb_safety_rule';
GO

CREATE INDEX IX_tb_safety_rule_industry_sort_active
    ON tb_safety_rule(industry_code, sort_order, active);
GO

-- =====================================================================
-- tb_audit_inspection : 정기 감사/점검 기록 (관리자용, slide 22 연계)
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'정기 감사/점검 기록. inspection_type: REGULAR/SPECIAL/FOLLOW_UP. status: OPEN/CLOSED.', 'SCHEMA', 'dbo', 'TABLE', 'tb_audit_inspection';
GO

CREATE INDEX IX_tb_audit_inspection_date_status
    ON tb_audit_inspection(inspection_date DESC, status);
GO
