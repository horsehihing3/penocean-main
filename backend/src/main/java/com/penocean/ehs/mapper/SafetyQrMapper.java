package com.penocean.ehs.mapper;

import com.penocean.ehs.dto.response.SafetyQrRecordResponse;
import com.penocean.ehs.dto.response.SafetyQrResponse;
import com.penocean.ehs.model.SafetyQr;
import com.penocean.ehs.model.SafetyQrRecord;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SafetyQrMapper {

    List<SafetyQrResponse> findAll();

    SafetyQrResponse findById(@Param("id") Long id);

    SafetyQr findByToken(@Param("token") String token);

    void insert(SafetyQr qr);

    void deactivate(@Param("id") Long id);

    void insertRecord(SafetyQrRecord record);

    List<SafetyQrRecordResponse> findRecordsByQrId(@Param("qrId") Long qrId);

    int countRecordsByQrId(@Param("qrId") Long qrId);
}
