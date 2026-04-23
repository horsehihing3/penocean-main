package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.SeaCrewIncidentBulkRequest;
import com.penocean.ehs.dto.response.SeaCrewIncidentResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.mapper.SeaCrewIncidentMapper;
import com.penocean.ehs.model.SeaCrewIncident;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeaCrewIncidentService {

    private static final Set<String> INCIDENT_TYPES = Set.of("ILLNESS", "INJURY");

    private final SeaCrewIncidentMapper mapper;

    @Transactional(readOnly = true)
    public PageResponse<SeaCrewIncidentResponse> list(Long vesselId, Integer year, Integer month,
                                                      String incidentType,
                                                      int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        return PageResponse.of(
                mapper.findPage(vesselId, year, month, incidentType, offset, s),
                mapper.count(vesselId, year, month, incidentType),
                p, s);
    }

    @Transactional
    public int bulkInsert(SeaCrewIncidentBulkRequest request, User caller) {
        if (request == null || request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("items는 비어있을 수 없습니다.");
        }
        List<SeaCrewIncident> rows = new ArrayList<>();
        for (SeaCrewIncidentBulkRequest.Item it : request.getItems()) {
            validateItem(it);
            rows.add(SeaCrewIncident.builder()
                    .vesselId(it.getVesselId())
                    .periodYear(it.getPeriodYear())
                    .periodMonth(it.getPeriodMonth())
                    .crewName(it.getCrewName())
                    .crewRole(it.getCrewRole())
                    .incidentType(it.getIncidentType().toUpperCase())
                    .incidentDate(it.getIncidentDate())
                    .diagnosis(it.getDiagnosis())
                    .evacuationRequired(Boolean.TRUE.equals(it.getEvacuationRequired()))
                    .returnToDutyDate(it.getReturnToDutyDate())
                    .excelUploadId(request.getExcelUploadId())
                    .build());
        }
        mapper.bulkInsert(rows);
        log.info("SeaCrewIncident bulk inserted: count={}, uploadId={}, by={}",
                rows.size(), request.getExcelUploadId(), caller.getId());
        return rows.size();
    }

    private void validateItem(SeaCrewIncidentBulkRequest.Item it) {
        if (it.getVesselId() == null) throw new BadRequestException("vesselId는 필수입니다.");
        if (it.getPeriodYear() == null) throw new BadRequestException("periodYear는 필수입니다.");
        if (it.getPeriodMonth() == null || it.getPeriodMonth() < 1 || it.getPeriodMonth() > 12) {
            throw new BadRequestException("periodMonth는 1~12 이어야 합니다.");
        }
        if (it.getIncidentType() == null || !INCIDENT_TYPES.contains(it.getIncidentType().toUpperCase())) {
            throw new BadRequestException("incidentType은 ILLNESS/INJURY 이어야 합니다.");
        }
        if (it.getCrewName() == null || it.getCrewName().isBlank()) {
            throw new BadRequestException("crewName은 필수입니다.");
        }
        if (it.getIncidentDate() == null) throw new BadRequestException("incidentDate는 필수입니다.");
    }
}
