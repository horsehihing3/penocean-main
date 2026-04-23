package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.SafetyPerformanceLandRequest;
import com.penocean.ehs.dto.response.SafetyPerformanceLandResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.mapper.SafetyPerformanceLandMapper;
import com.penocean.ehs.model.SafetyPerformanceLand;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyPerformanceLandService {

    private static final BigDecimal TRIR_CONSTANT = new BigDecimal("200000");

    private final SafetyPerformanceLandMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<SafetyPerformanceLandResponse> list(Long departmentId, Integer year, Integer month,
                                                            int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        return PageResponse.of(
                mapper.findPage(departmentId, year, month, offset, s),
                mapper.count(departmentId, year, month),
                p, s);
    }

    @Transactional
    public Long upsert(SafetyPerformanceLandRequest request, User caller) {
        validate(request);

        BigDecimal manhours = request.getManhours() == null ? BigDecimal.ZERO : request.getManhours();
        int accident = request.getAccidentCount() == null ? 0 : request.getAccidentCount();
        int lostTime = request.getLostTimeCount() == null ? 0 : request.getLostTimeCount();

        BigDecimal trir = computeRate(accident, manhours);
        BigDecimal ltir = computeRate(lostTime, manhours);

        SafetyPerformanceLand existing = mapper.findByKey(
                request.getDepartmentId(), request.getPeriodYear(), request.getPeriodMonth());

        if (existing == null) {
            SafetyPerformanceLand entity = SafetyPerformanceLand.builder()
                    .departmentId(request.getDepartmentId())
                    .periodYear(request.getPeriodYear())
                    .periodMonth(request.getPeriodMonth())
                    .manhours(manhours)
                    .accidentCount(accident)
                    .lostTimeCount(lostTime)
                    .fatalityCount(request.getFatalityCount() == null ? 0 : request.getFatalityCount())
                    .trir(trir)
                    .ltir(ltir)
                    .budgetPlanned(request.getBudgetPlanned())
                    .budgetUsed(request.getBudgetUsed())
                    .fcmProjectCode(request.getFcmProjectCode())
                    .vbpProjectCode(request.getVbpProjectCode())
                    .reportedBy(caller.getId())
                    .comment(request.getComment())
                    .build();
            mapper.insert(entity);
            log.info("SafetyPerformanceLand inserted: id={}, dept={}, {}-{}",
                    entity.getId(), request.getDepartmentId(), request.getPeriodYear(), request.getPeriodMonth());
            return entity.getId();
        } else {
            existing.setManhours(manhours);
            existing.setAccidentCount(accident);
            existing.setLostTimeCount(lostTime);
            existing.setFatalityCount(request.getFatalityCount() == null ? 0 : request.getFatalityCount());
            existing.setTrir(trir);
            existing.setLtir(ltir);
            existing.setBudgetPlanned(request.getBudgetPlanned());
            existing.setBudgetUsed(request.getBudgetUsed());
            existing.setFcmProjectCode(request.getFcmProjectCode());
            existing.setVbpProjectCode(request.getVbpProjectCode());
            existing.setReportedBy(caller.getId());
            existing.setComment(request.getComment());
            mapper.update(existing);
            log.info("SafetyPerformanceLand updated: id={}", existing.getId());
            return existing.getId();
        }
    }

    /**
     * Phase 6에서 실제 Excel export (Apache POI)를 구현.
     * 현재 stub으로 CSV 바이트 반환.
     */
    @Transactional(readOnly = true)
    public byte[] exportExcel(Integer year, Integer month) {
        StringBuilder csv = new StringBuilder();
        csv.append("departmentId,year,month,manhours,accidentCount,lostTimeCount,fatalityCount,trir,ltir\n");
        for (SafetyPerformanceLandResponse r : mapper.findPage(null, year, month, 0, 1000)) {
            csv.append(r.getDepartmentId()).append(',')
               .append(r.getPeriodYear()).append(',')
               .append(r.getPeriodMonth()).append(',')
               .append(r.getManhours() == null ? "" : r.getManhours()).append(',')
               .append(r.getAccidentCount() == null ? "" : r.getAccidentCount()).append(',')
               .append(r.getLostTimeCount() == null ? "" : r.getLostTimeCount()).append(',')
               .append(r.getFatalityCount() == null ? "" : r.getFatalityCount()).append(',')
               .append(r.getTrir() == null ? "" : r.getTrir()).append(',')
               .append(r.getLtir() == null ? "" : r.getLtir()).append('\n');
        }
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    private void validate(SafetyPerformanceLandRequest request) {
        if (request == null) throw new BadRequestException("요청 바디가 비어있습니다.");
        if (request.getDepartmentId() == null) throw new BadRequestException("departmentId는 필수입니다.");
        if (request.getPeriodYear() == null) throw new BadRequestException("periodYear는 필수입니다.");
        if (request.getPeriodMonth() == null
                || request.getPeriodMonth() < 1 || request.getPeriodMonth() > 12) {
            throw new BadRequestException("periodMonth는 1~12 이어야 합니다.");
        }
    }

    private BigDecimal computeRate(int count, BigDecimal manhours) {
        if (manhours == null || manhours.signum() <= 0) return BigDecimal.ZERO;
        return BigDecimal.valueOf(count).multiply(TRIR_CONSTANT)
                .divide(manhours, 4, RoundingMode.HALF_UP);
    }
}
