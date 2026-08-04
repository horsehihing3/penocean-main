-- =====================================================================
-- [2026-08-04] 개인정보 수집·이용 동의 이력 (PPT 5p)
-- 회원가입 시 받은 동의 내역을 법적 증빙 목적으로 보관한다.
-- 동의 문구가 개정될 수 있으므로 가입 시점의 버전을 함께 남긴다.
-- =====================================================================

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'tb_privacy_consent')
BEGIN
    CREATE TABLE tb_privacy_consent (
        id             BIGINT       IDENTITY(1,1) NOT NULL,
        user_id        BIGINT       NOT NULL,
        -- [필수] 개인정보 수집·이용 동의 (동의 / 동의안함)
        privacy_agreed BIT          NOT NULL,
        -- 만 14세 이상 확인
        over14_agreed  BIT          NOT NULL DEFAULT 0,
        -- 동의 당시 문구 버전. 문구 개정 시 어떤 내용에 동의했는지 추적용
        consent_version VARCHAR(20) NOT NULL DEFAULT 'v1',
        agreed_at      DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        -- 동의 주체 확인용 접속 정보
        agreed_ip      VARCHAR(45)  NULL,
        created_at     DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tb_privacy_consent PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_privacy_consent_user FOREIGN KEY (user_id) REFERENCES tb_user(id)
    );

    CREATE INDEX IX_privacy_consent_user ON tb_privacy_consent (user_id);
END;
GO

EXEC sp_addextendedproperty 'MS_Description',
    N'개인정보 수집·이용 동의 이력. 회원가입 시 1건 생성, 재가입 시 추가 생성.',
    'SCHEMA', 'dbo', 'TABLE', 'tb_privacy_consent';
GO

-- ---------------------------------------------------------------------
-- tb_user 에 최신 동의 여부를 비정규화로 보관 (목록 조회 시 JOIN 회피)
-- ---------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_user') AND name = 'privacy_agreed'
)
BEGIN
    ALTER TABLE tb_user ADD privacy_agreed BIT NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_user') AND name = 'over14_agreed'
)
BEGIN
    ALTER TABLE tb_user ADD over14_agreed BIT NOT NULL DEFAULT 0;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('tb_user') AND name = 'privacy_agreed_at'
)
BEGIN
    ALTER TABLE tb_user ADD privacy_agreed_at DATETIME2 NULL;
END;
GO

-- 기존 가입자는 동의를 받고 가입한 것으로 간주 (가입일 기준)
UPDATE tb_user
   SET privacy_agreed    = 1,
       over14_agreed     = 1,
       privacy_agreed_at = created_at
 WHERE privacy_agreed = 0
   AND deleted = 0;
GO
