-- =====================================================================
-- Phase 7 / V16 : PPT slide 6 회원가입 확장 필드
-- - tb_company 에 업체 영문명/우편번호/상세주소/사업자등록증 파일/기타업종 추가
-- - tb_user 에 직책(title) 추가 (안전담당자 직책)
-- =====================================================================

IF COL_LENGTH('dbo.tb_company', 'name_en') IS NULL
BEGIN
    ALTER TABLE dbo.tb_company ADD name_en NVARCHAR(200) NULL;
END
GO

IF COL_LENGTH('dbo.tb_company', 'postal_code') IS NULL
BEGIN
    ALTER TABLE dbo.tb_company ADD postal_code VARCHAR(10) NULL;
END
GO

IF COL_LENGTH('dbo.tb_company', 'address_detail') IS NULL
BEGIN
    ALTER TABLE dbo.tb_company ADD address_detail NVARCHAR(500) NULL;
END
GO

IF COL_LENGTH('dbo.tb_company', 'business_license_file_path') IS NULL
BEGIN
    ALTER TABLE dbo.tb_company ADD business_license_file_path NVARCHAR(500) NULL;
END
GO

IF COL_LENGTH('dbo.tb_company', 'industry_other') IS NULL
BEGIN
    ALTER TABLE dbo.tb_company ADD industry_other NVARCHAR(200) NULL;
END
GO

IF COL_LENGTH('dbo.tb_user', 'title') IS NULL
BEGIN
    ALTER TABLE dbo.tb_user ADD title NVARCHAR(50) NULL;
END
GO
