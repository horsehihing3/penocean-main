package com.penocean.ehs.service;

import com.penocean.ehs.dto.response.SomCompanyLookupResponse;
import com.penocean.ehs.mapper.SomCompanySnapshotMapper;
import com.penocean.ehs.model.SomCompanySnapshot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * SOM(사업자 연동) stub.
 * Phase 4 에서는 tb_som_company_snapshot 만 조회하며,
 * 실 SOM API 연동은 TODO. 수동 upsert 엔드포인트로 관리자가 넣는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SomLookupService {

    private final SomCompanySnapshotMapper mapper;

    @Transactional(readOnly = true)
    public Optional<SomCompanyLookupResponse> lookupByBusinessNumber(String businessNumber) {
        if (businessNumber == null || businessNumber.isBlank()) return Optional.empty();
        String normalized = businessNumber.replaceAll("[^0-9]", "");
        SomCompanySnapshot snap = mapper.findByBusinessNumber(normalized);
        if (snap == null) {
            // TODO: 실제 SOM 연동 구현 시, 외부 호출 후 snapshot upsert
            log.info("SOM lookup miss: businessNumber={}", normalized);
            return Optional.empty();
        }
        return Optional.of(toResponse(snap, true));
    }

    @Transactional(readOnly = true)
    public List<SomCompanyLookupResponse> listSnapshots(String keyword, int offset, int limit) {
        return mapper.findAll(keyword, offset, limit).stream()
                .map(s -> toResponse(s, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public long countSnapshots(String keyword) {
        return mapper.count(keyword);
    }

    @Transactional
    public void upsert(SomCompanyLookupResponse payload) {
        if (payload == null || payload.getBusinessNumber() == null || payload.getBusinessNumber().isBlank()) {
            throw new IllegalArgumentException("businessNumber는 필수입니다.");
        }
        SomCompanySnapshot snap = SomCompanySnapshot.builder()
                .businessNumber(payload.getBusinessNumber().replaceAll("[^0-9]", ""))
                .companyName(payload.getCompanyName())
                .ceoName(payload.getCeoName())
                .address(payload.getAddress())
                .industry(payload.getIndustry())
                .employeeCount(payload.getEmployeeCount())
                .annualRevenue(payload.getAnnualRevenue() != null
                        ? payload.getAnnualRevenue() : BigDecimal.ZERO)
                .build();
        mapper.upsert(snap);
        log.info("SOM snapshot upserted: businessNumber={}", snap.getBusinessNumber());
    }

    private SomCompanyLookupResponse toResponse(SomCompanySnapshot s, boolean fromSnapshot) {
        return SomCompanyLookupResponse.builder()
                .businessNumber(s.getBusinessNumber())
                .companyName(s.getCompanyName())
                .ceoName(s.getCeoName())
                .address(s.getAddress())
                .industry(s.getIndustry())
                .employeeCount(s.getEmployeeCount())
                .annualRevenue(s.getAnnualRevenue())
                .lastSyncedAt(s.getLastSyncedAt())
                .fromSnapshot(fromSnapshot)
                .build();
    }
}
