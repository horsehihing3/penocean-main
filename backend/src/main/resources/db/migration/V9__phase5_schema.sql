-- =====================================================================
-- V9__phase5_schema.sql
-- 팬오션 안전보건 DX - Phase 5
--   근로자 의견조회(slide 16-17) / 산업재해(slide 28) /
--   육상·해상 안전보건실적(slide 29-30) / 해상직원 상세(엑셀)
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
--  - tb_worker_voice.voice_no         : WV-YYYYMMDD-NNNN
--  - tb_industrial_accident.accident_no: IA-YYYYMMDD-NNNN
--  - voice_type       : NEAR_MISS / INCIDENT / INQUIRY
--  - voice status     : SUBMITTED / TRIAGED / IN_PROGRESS / RESOLVED / CLOSED
--  - severity (voice/accident) : LOW/MEDIUM/HIGH/CRITICAL  (INCIDENT)
--                                MINOR/SERIOUS/FATAL       (accident)
--  - accident_type    : FALL/STRUCK/CUT/BURN/ELECTRIC/OTHER
--  - incident_type    : ILLNESS / INJURY
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- tb_worker_voice : 근로자 의견조회 (slide 16-17)
--   voice_no 포맷 : WV-YYYYMMDD-NNNN
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'근로자 의견조회 (아차사고/산업재해/일반문의). voice_no: WV-YYYYMMDD-NNNN. 팀메일 자동발송 대상 email_sent_to.', 'SCHEMA', 'dbo', 'TABLE', 'tb_worker_voice';
GO

CREATE INDEX IX_tb_worker_voice_type_status
    ON tb_worker_voice(voice_type, status);
GO
CREATE INDEX IX_tb_worker_voice_company_created
    ON tb_worker_voice(company_id, created_at DESC);
GO

-- =====================================================================
-- tb_voice_attachment : 근로자 의견 첨부 (CASCADE on voice 삭제)
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'근로자 의견 첨부파일. voice 삭제 시 CASCADE.', 'SCHEMA', 'dbo', 'TABLE', 'tb_voice_attachment';
GO

CREATE INDEX IX_tb_voice_attachment_voice
    ON tb_voice_attachment(voice_id);
GO

-- =====================================================================
-- tb_industrial_accident : 산업재해 (slide 28)
--   accident_no : IA-YYYYMMDD-NNNN
--   business_number : SOM 조회 시 snapshot
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'산업재해 등록 (재해조사표). accident_no: IA-YYYYMMDD-NNNN. business_number 는 SOM 조회 스냅샷.', 'SCHEMA', 'dbo', 'TABLE', 'tb_industrial_accident';
GO

CREATE INDEX IX_tb_industrial_accident_business
    ON tb_industrial_accident(business_number);
GO
CREATE INDEX IX_tb_industrial_accident_company_date
    ON tb_industrial_accident(company_id, accident_date DESC);
GO

-- =====================================================================
-- tb_safety_performance_land : 육상 안전보건실적 (slide 29)
--   월별 기입. TRIR/LTIR 계산 지표. FCM/VBP 연동 예산.
-- =====================================================================
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

CREATE INDEX IX_tb_safety_performance_land_period
    ON tb_safety_performance_land(period_year, period_month);
GO

-- =====================================================================
-- tb_safety_performance_sea : 해상 안전보건실적 (slide 30)
--   vessel × (period_year, period_month). 포스에스엠 동기화 + 엑셀 일괄.
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'해상 안전보건실적 (선박×월). 승선/질병/부상/하선. 포스에스엠 동기화 + 엑셀 배치.', 'SCHEMA', 'dbo', 'TABLE', 'tb_safety_performance_sea';
GO

CREATE INDEX IX_tb_safety_performance_sea_vessel_period
    ON tb_safety_performance_sea(vessel_id, period_year DESC, period_month DESC);
GO

-- =====================================================================
-- tb_sea_crew_incident : 해상직원 질병/부상 상세 (slide 30 엑셀 업로드)
-- =====================================================================
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

CREATE INDEX IX_tb_sea_crew_incident_vessel_date
    ON tb_sea_crew_incident(vessel_id, incident_date DESC);
GO
