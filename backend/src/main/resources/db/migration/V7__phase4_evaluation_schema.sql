-- =====================================================================
-- V7__phase4_evaluation_schema.sql
-- 팬오션 안전보건 DX - Phase 4 협력업체 평가(14항목) / 개선요청 이력 / SOM 스냅샷
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
--  - tb_evaluation.evaluation_no 포맷  : EV-YYYYNN-NNNN  (YYYY=연도, NN=H1/H2 반기, NNNN=일련)
--  - period(year, half) 조합           : (INT, 'H1'|'H2')
--  - tb_evaluation_item.code 14종 고정 : V8 시드 참조
-- =====================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- =====================================================================
-- tb_evaluation_item : 협력업체 안전보건 평가 항목 마스터 (14항목)
--   관리자 화면에서 편집 가능 (slide 26)
-- =====================================================================
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

CREATE INDEX IX_tb_evaluation_item_category_sort_active
    ON tb_evaluation_item(category, sort_order, active);
GO

-- =====================================================================
-- tb_evaluation : 평가 헤더
--   evaluation_no : EV-YYYYNN-NNNN (NN = 01(H1) / 02(H2)) -- 파서는 period_half 로 판단
--   status        : DRAFT / SUBMITTED / APPROVED / REJECTED
--   evaluation_type : REGULAR / SPECIAL
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'협력업체 평가 헤더. evaluation_no: EV-YYYYNN-NNNN. (company_id, period_year, period_half, evaluation_type) UNIQUE.', 'SCHEMA', 'dbo', 'TABLE', 'tb_evaluation';
GO

CREATE INDEX IX_tb_evaluation_company_period
    ON tb_evaluation(company_id, period_year DESC, period_half DESC);
GO
CREATE INDEX IX_tb_evaluation_status ON tb_evaluation(status);
GO

-- =====================================================================
-- tb_evaluation_item_score : 평가별 14개 항목 점수
-- =====================================================================
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

EXEC sp_addextendedproperty 'MS_Description', N'평가별 항목 점수 (14 row/eval). weighted_score = score * weight.', 'SCHEMA', 'dbo', 'TABLE', 'tb_evaluation_item_score';
GO

CREATE INDEX IX_tb_evaluation_item_score_evaluation
    ON tb_evaluation_item_score(evaluation_id);
GO

-- =====================================================================
-- tb_evaluation_attachment : 평가 증빙 첨부 (item_id NULL 이면 헤더 공통)
-- =====================================================================
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

CREATE INDEX IX_tb_evaluation_attachment_evaluation
    ON tb_evaluation_attachment(evaluation_id);
GO

-- =====================================================================
-- tb_evaluation_improvement : 개선요청 이력 (slide 26)
--   status : OPEN / RESPONDED / CLOSED / OVERDUE
-- =====================================================================
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

CREATE INDEX IX_tb_evaluation_improvement_eval_status
    ON tb_evaluation_improvement(evaluation_id, status);
GO

-- =====================================================================
-- tb_som_company_snapshot : SOM 연동 스냅샷 (slide 20 stub)
--   사업자번호(business_number) 기반
-- =====================================================================
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

CREATE INDEX IX_tb_som_company_snapshot_biz
    ON tb_som_company_snapshot(business_number);
GO
