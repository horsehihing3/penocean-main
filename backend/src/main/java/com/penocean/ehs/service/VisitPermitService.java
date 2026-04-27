package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.response.VisitPermitResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.VisitPermitMapper;
import com.penocean.ehs.model.VisitPermit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VisitPermitService {

    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final VisitPermitMapper visitPermitMapper;

    @Transactional(readOnly = true)
    public PageResponse<VisitPermitResponse> list(Long companyId, Long vesselId,
                                                  LocalDate validFrom, LocalDate validTo,
                                                  Boolean revoked, int page, int size) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        List<VisitPermitResponse> content = visitPermitMapper.findPage(companyId, vesselId, validFrom, validTo, revoked, offset, s);
        long total = visitPermitMapper.count(companyId, vesselId, validFrom, validTo, revoked);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public VisitPermitResponse detail(Long id) {
        VisitPermitResponse detail = visitPermitMapper.findDetailById(id);
        if (detail == null) {
            throw new ResourceNotFoundException("VisitPermit", "id", id);
        }
        return detail;
    }

    @Transactional(readOnly = true)
    public VisitPermitResponse findByAccessRequestId(Long accessRequestId) {
        VisitPermitResponse detail = visitPermitMapper.findByAccessRequestId(accessRequestId);
        if (detail == null) {
            throw new ResourceNotFoundException("VisitPermit", "accessRequestId", accessRequestId);
        }
        return detail;
    }

    @Transactional
    public void revoke(Long id, String reason, Long userId) {
        VisitPermit permit = visitPermitMapper.findById(id);
        if (permit == null) {
            throw new ResourceNotFoundException("VisitPermit", "id", id);
        }
        if (Boolean.TRUE.equals(permit.getRevoked())) {
            throw new BadRequestException("이미 취소된 Visit Permit 입니다.");
        }
        visitPermitMapper.revoke(id, reason);
        log.info("VisitPermit revoked: id={}, reason={}, userId={}", id, reason, userId);
    }

    /**
     * Access request APPROVE 시점에 호출. validFrom = plannedStartDate 00:00, validTo = plannedEndDate 23:59:59.
     */
    @Transactional
    public VisitPermit issueFor(Long accessRequestId, Long vesselId, Long companyId,
                                LocalDate plannedStartDate, LocalDate plannedEndDate, Long issuedBy) {
        String permitNo = generatePermitNo(LocalDate.now());
        LocalDateTime validFrom = LocalDateTime.of(plannedStartDate, LocalTime.MIN);
        LocalDateTime validTo = LocalDateTime.of(plannedEndDate, LocalTime.of(23, 59, 59));

        VisitPermit permit = VisitPermit.builder()
                .permitNo(permitNo)
                .accessRequestId(accessRequestId)
                .vesselId(vesselId)
                .companyId(companyId)
                .validFrom(validFrom)
                .validTo(validTo)
                .qrCodeUrl(generateQrCodeUrl(permitNo))
                .issuedBy(issuedBy)
                .revoked(false)
                .build();
        visitPermitMapper.insert(permit);
        log.info("VisitPermit issued: permitNo={}, accessRequestId={}", permitNo, accessRequestId);
        return permit;
    }

    /** 단순히 `/api/visit-permits/qr/{permitNo}` 문자열 반환. 실제 QR 이미지는 Phase 6. */
    public String generateQrCodeUrl(String permitNo) {
        return "/api/visit-permits/qr/" + permitNo;
    }

    private String generatePermitNo(LocalDate date) {
        String ymd = date.format(YMD);
        Integer max = visitPermitMapper.findMaxPermitNoSeq(ymd);
        int next = (max == null ? 0 : max) + 1;
        return String.format("VP-%s-%04d", ymd, next);
    }
}
