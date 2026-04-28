-- [2026-04-28] 건강검진 결과 파싱 저장 테이블 — PDF 업로드 후 추출된 수치 보관
CREATE TABLE tb_health_checkup_result (
    id              BIGINT IDENTITY(1,1) PRIMARY KEY,
    checkup_year    INT,
    checkup_date    DATE,
    hospital_name   NVARCHAR(100),
    department      NVARCHAR(100),
    emp_name        NVARCHAR(50) NOT NULL,
    birth_date      DATE,
    gender          NVARCHAR(10),
    age             INT,

    -- 신체계측
    height          DECIMAL(5,1),
    weight          DECIMAL(5,1),
    bmi             DECIMAL(4,1),
    waist           DECIMAL(5,1),
    vision_right    DECIMAL(4,1),
    vision_left     DECIMAL(4,1),

    -- 혈압
    bp_systolic     INT,
    bp_diastolic    INT,
    bp_category     NVARCHAR(5),
    bp_med          BIT DEFAULT 0,

    -- 혈액 (공통)
    hemoglobin      DECIMAL(4,1),
    bst             INT,
    dm_category     NVARCHAR(5),
    dm_med          BIT DEFAULT 0,

    -- 이상지질혈증
    tc              INT,
    hdl             INT,
    tg              INT,
    ldl             INT,
    dl_category     NVARCHAR(5),
    dl_med          BIT DEFAULT 0,

    -- 신장/간 기능
    creatinine      DECIMAL(5,2),
    egfr            INT,
    ast             INT,
    alt             INT,
    ggt             INT,

    -- 사후관리
    followup_opinion NVARCHAR(500),
    work_fitness    NVARCHAR(10),
    note            NVARCHAR(1000),

    -- 메타
    parser_type     NVARCHAR(30),
    source_file     NVARCHAR(255),
    created_by      NVARCHAR(50),
    created_at      DATETIME2 DEFAULT SYSUTCDATETIME(),
    deleted         BIT DEFAULT 0
);

CREATE INDEX IX_health_checkup_result_year ON tb_health_checkup_result (checkup_year) WHERE deleted = 0;
CREATE INDEX IX_health_checkup_result_name ON tb_health_checkup_result (emp_name)     WHERE deleted = 0;
