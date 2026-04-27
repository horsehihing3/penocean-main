package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.DailySafetyLogCreateRequest;
import com.penocean.ehs.dto.response.DailySafetyLogResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.DailySafetyLogMapper;
import com.penocean.ehs.model.DailySafetyLog;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DailySafetyLogService {

    private final DailySafetyLogMapper dailySafetyLogMapper;

    @Transactional(readOnly = true)
    public PageResponse<DailySafetyLogResponse> list(Long vesselId, Long companyId,
                                                     LocalDate dateFrom, LocalDate dateTo,
                                                     int page, int size) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        List<DailySafetyLogResponse> content = dailySafetyLogMapper.findPage(vesselId, companyId, dateFrom, dateTo, offset, s);
        long total = dailySafetyLogMapper.count(vesselId, companyId, dateFrom, dateTo);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public DailySafetyLogResponse detail(Long id) {
        DailySafetyLogResponse detail = dailySafetyLogMapper.findById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("DailySafetyLog", "id", id);
        }
        return detail;
    }

    @Transactional
    public Long create(DailySafetyLogCreateRequest req, User caller) {
        if (req.getVesselId() == null) {
            throw new BadRequestException("vesselId는 필수입니다.");
        }
        if (req.getLogDate() == null) {
            throw new BadRequestException("logDate는 필수입니다.");
        }
        DailySafetyLog entity = DailySafetyLog.builder()
                .vesselId(req.getVesselId())
                .companyId(req.getCompanyId())
                .logDate(req.getLogDate())
                .representativeName(req.getRepresentativeName())
                .attendeesCount(req.getAttendeesCount() == null ? 0 : req.getAttendeesCount())
                .trainingContent(req.getTrainingContent())
                .scannedFileUrl(req.getScannedFileUrl())
                .kakaoMessageId(req.getKakaoMessageId())
                .receivedVia(req.getReceivedVia() == null ? "UPLOAD" : req.getReceivedVia())
                .build();
        dailySafetyLogMapper.insert(entity);
        log.info("DailySafetyLog created: id={}, vesselId={}, logDate={}", entity.getId(), entity.getVesselId(), entity.getLogDate());
        return entity.getId();
    }

    @Transactional
    public void delete(Long id, User caller) {
        DailySafetyLogResponse detail = dailySafetyLogMapper.findById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("DailySafetyLog", "id", id);
        }
        dailySafetyLogMapper.softDelete(id);
        log.info("DailySafetyLog deleted: id={}, userId={}", id, caller == null ? null : caller.getId());
    }
}
