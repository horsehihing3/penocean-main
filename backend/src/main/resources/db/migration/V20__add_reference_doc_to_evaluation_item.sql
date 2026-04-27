-- [2026-04-24] PPT 슬라이드 25: tb_evaluation_item에 참고서류(첨부파일) 컬럼 추가
IF COL_LENGTH('dbo.tb_evaluation_item', 'reference_doc') IS NULL
BEGIN
    ALTER TABLE dbo.tb_evaluation_item ADD reference_doc NVARCHAR(500) NULL;
END
GO

-- PPT 슬라이드 25 기준 각 항목별 첨부파일 텍스트 세팅
UPDATE tb_evaluation_item SET reference_doc = N'안전보건 방침'                                               WHERE code = 'GENERAL_PRINCIPLE';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건관리계획서'                                          WHERE code = 'PLAN_ESTABLISH';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건 조직표'                                             WHERE code = 'STRUCTURE_DUTY';
UPDATE tb_evaluation_item SET reference_doc = N'위험성평가 (최신버전)'                                       WHERE code = 'RISK_ASSESSMENT';
UPDATE tb_evaluation_item SET reference_doc = N'TBM 교육자료 (최신버전)'                                     WHERE code = 'SAFETY_INSPECTION';
UPDATE tb_evaluation_item SET reference_doc = N'도출된 유해위험 포인 개선방안 합 적용 사례'                  WHERE code = 'COMPLIANCE_CHECK';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건 교육 계획/기록루'                                   WHERE code = 'EDUCATION_RECORD';
UPDATE tb_evaluation_item SET reference_doc = N'최근 작업허가서 샘플'                                        WHERE code = 'WORK_PERMIT';
UPDATE tb_evaluation_item SET reference_doc = N'비상연락망'                                                  WHERE code = 'SIGNAL_CONTACT';
UPDATE tb_evaluation_item SET reference_doc = N'해당 기구 사용 지침서'                                       WHERE code = 'HAZMAT_FACILITY';
UPDATE tb_evaluation_item SET reference_doc = N'비상대응절차서'                                              WHERE code = 'EMERGENCY_PLAN';
UPDATE tb_evaluation_item SET reference_doc = N'1. 사업장산업재해율 소자표  2. 원인 및 재발방지 대책'        WHERE code = 'ACCIDENT_STATUS';
UPDATE tb_evaluation_item SET reference_doc = N'관련 증빙자료'                                               WHERE code = 'LAW_VIOLATION';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건관리비 집행 이력'                                    WHERE code = 'SAFETY_MGT_COST';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건관리 규정'                                           WHERE code = 'SAFETY_REGULATION';
UPDATE tb_evaluation_item SET reference_doc = N'안전보건경영시스템 인증서'                                   WHERE code = 'SAFETY_MGMT_SYS';
UPDATE tb_evaluation_item SET reference_doc = N'우수사업자 인증 자료'                                        WHERE code = 'RISK_CERT';
UPDATE tb_evaluation_item SET reference_doc = N'체결 대상 동반자료'                                          WHERE code = 'PORT_AGREEMENT';
UPDATE tb_evaluation_item SET reference_doc = N'재해경감우수기업 인증 자료'                                  WHERE code = 'DISASTER_REDUCTION';
UPDATE tb_evaluation_item SET reference_doc = N'증빙자료'                                                    WHERE code = 'HEALTH_PROMOTION';
UPDATE tb_evaluation_item SET reference_doc = N'포상 자료'                                                   WHERE code = 'EXTERNAL_AWARD';
GO
