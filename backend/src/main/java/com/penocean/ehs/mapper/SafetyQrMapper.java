package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.SafetyQrRecordResponse;
import com.penocean.ehs.dto.response.SafetyQrResponse;
import com.penocean.ehs.model.SafetyQr;
import com.penocean.ehs.model.SafetyQrRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SafetyQrMapper {

    List<SafetyQrResponse> findAll();

    SafetyQrResponse findById(@Param("id") Long id);

    // [2026-04-27] 공개 로그인 화면용 — 현재 활성 QR 단일 조회
    SafetyQrResponse findActiveOne();

    SafetyQr findByToken(@Param("token") String token);

    void insert(SafetyQr qr);

    void deactivate(@Param("id") Long id);

    // [2026-04-27] Singleton: 신규 생성 전 기존 활성 QR 일괄 비활성화
    void deactivateAll();

    void insertRecord(SafetyQrRecord record);

    List<SafetyQrRecordResponse> findRecordsByQrId(@Param("qrId") Long qrId);

    int countRecordsByQrId(@Param("qrId") Long qrId);

    // [2026-04-27] 공개 cascading 조회 — 선박 → 업체 → 작업자
    List<Map<String, Object>> findActiveVessels();

    List<Map<String, Object>> findCompaniesByVessel(@Param("vesselId") Long vesselId);

    List<Map<String, Object>> findWorkersByVesselAndCompany(@Param("vesselId") Long vesselId,
                                                            @Param("companyId") Long companyId);
}
