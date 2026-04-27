package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.SafetyPerformanceSeaRequest;
import com.penocean.ehs.dto.response.SafetyPerformanceSeaResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.mapper.SafetyPerformanceSeaMapper;
import com.penocean.ehs.model.SafetyPerformanceSea;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyPerformanceSeaService {

    private final SafetyPerformanceSeaMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<SafetyPerformanceSeaResponse> list(Long vesselId, Integer year, Integer month,
                                                           int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        return PageResponse.of(
                mapper.findPage(vesselId, year, month, offset, s),
                mapper.count(vesselId, year, month),
                p, s);
    }

    @Transactional
    public Long upsert(SafetyPerformanceSeaRequest request, User caller) {
        validate(request);

        SafetyPerformanceSea existing = mapper.findByKey(
                request.getVesselId(), request.getPeriodYear(), request.getPeriodMonth());

        if (existing == null) {
            SafetyPerformanceSea entity = SafetyPerformanceSea.builder()
                    .vesselId(request.getVesselId())
                    .periodYear(request.getPeriodYear())
                    .periodMonth(request.getPeriodMonth())
                    .crewCount(nvl(request.getCrewCount()))
                    .illnessCount(nvl(request.getIllnessCount()))
                    .injuryCount(nvl(request.getInjuryCount()))
                    .evacuationCount(nvl(request.getEvacuationCount()))
                    .sickLeaveDays(nvl(request.getSickLeaveDays()))
                    .excelUploadId(request.getExcelUploadId())
                    .uploadedBy(caller.getId())
                    .comment(request.getComment())
                    .build();
            mapper.insert(entity);
            log.info("SafetyPerformanceSea inserted: id={}, vessel={}, {}-{}",
                    entity.getId(), request.getVesselId(), request.getPeriodYear(), request.getPeriodMonth());
            return entity.getId();
        } else {
            existing.setCrewCount(nvl(request.getCrewCount()));
            existing.setIllnessCount(nvl(request.getIllnessCount()));
            existing.setInjuryCount(nvl(request.getInjuryCount()));
            existing.setEvacuationCount(nvl(request.getEvacuationCount()));
            existing.setSickLeaveDays(nvl(request.getSickLeaveDays()));
            existing.setExcelUploadId(request.getExcelUploadId());
            existing.setUploadedBy(caller.getId());
            existing.setComment(request.getComment());
            mapper.update(existing);
            log.info("SafetyPerformanceSea updated: id={}", existing.getId());
            return existing.getId();
        }
    }

    /**
     * Phase 6에서 Apache POI 로 실제 엑셀 파싱 + bulk insert 구현.
     * 현재 stub: 업로드 id 만 발급하여 반환.
     */
    @Transactional
    public String importExcel(MultipartFile file, User caller) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("업로드 파일이 비어있습니다.");
        }
        String uploadId = "SEA-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        log.info("SafetyPerformanceSea excel import stub: uploadId={}, size={}, by={}",
                uploadId, file.getSize(), caller.getId());
        return uploadId;
    }

    private void validate(SafetyPerformanceSeaRequest request) {
        if (request == null) throw new BadRequestException("요청 바디가 비어있습니다.");
        if (request.getVesselId() == null) throw new BadRequestException("vesselId는 필수입니다.");
        if (request.getPeriodYear() == null) throw new BadRequestException("periodYear는 필수입니다.");
        if (request.getPeriodMonth() == null
                || request.getPeriodMonth() < 1 || request.getPeriodMonth() > 12) {
            throw new BadRequestException("periodMonth는 1~12 이어야 합니다.");
        }
    }

    private int nvl(Integer v) { return v == null ? 0 : v; }
}
