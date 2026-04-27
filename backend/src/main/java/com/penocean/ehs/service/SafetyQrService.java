package com.penocean.ehs.service;

import com.penocean.ehs.dto.request.SafetyQrCompleteRequest;
import com.penocean.ehs.dto.request.SafetyQrCreateRequest;
import com.penocean.ehs.dto.response.SafetyQrRecordResponse;
import com.penocean.ehs.dto.response.SafetyQrResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.SafetyQrMapper;
import com.penocean.ehs.model.SafetyQr;
import com.penocean.ehs.model.SafetyQrRecord;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SafetyQrService {

    private final SafetyQrMapper mapper;

    public List<SafetyQrResponse> listAll() {
        return mapper.findAll();
    }

    public SafetyQrResponse getById(Long id) {
        SafetyQrResponse r = mapper.findById(id);
        if (r == null) throw new ResourceNotFoundException("SafetyQr", "id", id);
        return r;
    }

    // [2026-04-27] 공개 접근용 — 토큰으로 QR 세션 조회
    public SafetyQr getByToken(String token) {
        SafetyQr qr = mapper.findByToken(token);
        if (qr == null) throw new ResourceNotFoundException("SafetyQr", "token", token);
        if (!Boolean.TRUE.equals(qr.getIsActive())) throw new BadRequestException("비활성화된 QR코드입니다.");
        if (qr.getExpiresAt() != null && qr.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
            throw new BadRequestException("만료된 QR코드입니다.");
        }
        return qr;
    }

    public SafetyQrResponse create(SafetyQrCreateRequest req, String createdBy) {
        SafetyQr qr = new SafetyQr();
        qr.setToken(UUID.randomUUID().toString().replace("-", ""));
        qr.setTitle(req.getTitle());
        qr.setVesselName(req.getVesselName());
        qr.setContent(req.getContent());
        qr.setCreatedBy(createdBy);
        qr.setExpiresAt(req.getExpiresAt());
        mapper.insert(qr);
        return mapper.findById(qr.getId());
    }

    public void deactivate(Long id) {
        getById(id);
        mapper.deactivate(id);
    }

    // [2026-04-27] 작업자 이수 완료 처리 (공개 엔드포인트)
    public void complete(String token, SafetyQrCompleteRequest req) {
        SafetyQr qr = getByToken(token);
        SafetyQrRecord record = new SafetyQrRecord();
        record.setQrId(qr.getId());
        record.setWorkerName(req.getWorkerName());
        record.setVesselName(req.getVesselName());
        record.setWorkDate(req.getWorkDate());
        record.setGender(req.getGender());
        record.setPhone(req.getPhone());
        mapper.insertRecord(record);
    }

    public List<SafetyQrRecordResponse> getRecords(Long qrId) {
        getById(qrId);
        return mapper.findRecordsByQrId(qrId);
    }
}
