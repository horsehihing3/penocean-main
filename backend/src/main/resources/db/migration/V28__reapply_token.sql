-- [2026-05-04] 반려 재가입 토큰 및 반려사유 컬럼 추가
ALTER TABLE tb_user ADD rejection_reason NVARCHAR(500) NULL;
ALTER TABLE tb_user ADD reapply_token    NVARCHAR(36)  NULL;
