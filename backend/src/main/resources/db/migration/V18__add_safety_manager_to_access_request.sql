-- [2026-04-23] PPT 슬라이드 14: 안전담당자(성명/Tel/E-Mail) 컬럼 추가
ALTER TABLE tb_access_request
  ADD safety_manager_name  NVARCHAR(100) NULL,
      safety_manager_tel   NVARCHAR(50)  NULL,
      safety_manager_email NVARCHAR(200) NULL;
