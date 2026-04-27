CREATE TABLE tb_notice_view (
    notice_id BIGINT NOT NULL,
    user_id   BIGINT NOT NULL,
    viewed_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT pk_notice_view PRIMARY KEY (notice_id, user_id)
);
