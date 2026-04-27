-- =====================================================================
-- V5__phase3_vessel_access.sql
-- 팬오션 안전보건 DX - Phase 3 사업장(선박) 출입관리 / Visit Permit / 첨부
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
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- tb_access_request : 사업장(선박) 출입신청
--   status: DRAFT / SUBMITTED / IN_REVIEW / IMPROVEMENT_REQUESTED / APPROVED / REJECTED
-- =====================================================================
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

CREATE INDEX IX_tb_access_request_status_submitted ON tb_access_request(status, submitted_at DESC);
GO
CREATE INDEX IX_tb_access_request_company          ON tb_access_request(company_id);
GO
CREATE INDEX IX_tb_access_request_vessel           ON tb_access_request(vessel_id);
GO

-- =====================================================================
-- tb_access_worker : 출입신청 작업자 리스트
-- =====================================================================
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

CREATE INDEX IX_tb_access_worker_request ON tb_access_worker(access_request_id);
GO

-- =====================================================================
-- tb_access_attachment : 출입신청 첨부파일 (위험성평가/서약서/작업계획서)
--   attachment_type: RISK_ASSESSMENT / PLEDGE / WORK_PLAN / OTHER
-- =====================================================================
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

CREATE INDEX IX_tb_access_attachment_request_type ON tb_access_attachment(access_request_id, attachment_type);
GO

-- =====================================================================
-- tb_visit_permit : Visit Permit (자동 발급)
--   permit_no 포맷: VP-YYYYMMDD-NNNN
-- =====================================================================
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

CREATE INDEX IX_tb_visit_permit_permit_no          ON tb_visit_permit(permit_no);
GO
CREATE INDEX IX_tb_visit_permit_vessel_valid_from  ON tb_visit_permit(vessel_id, valid_from DESC);
GO

-- =====================================================================
-- tb_access_review_log : 서류 검토 진행 로그
--   action: REVIEW_START / IMPROVEMENT_REQUEST / APPROVE / REJECT
-- =====================================================================
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

CREATE INDEX IX_tb_access_review_log_request ON tb_access_review_log(access_request_id, acted_at DESC);
GO

-- =====================================================================
-- tb_daily_safety_log : 승선대표자 일일안전교육일지
--   received_via: KAKAO / EMAIL / UPLOAD
-- =====================================================================
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

CREATE INDEX IX_tb_daily_safety_log_vessel_date ON tb_daily_safety_log(vessel_id, log_date DESC);
GO
