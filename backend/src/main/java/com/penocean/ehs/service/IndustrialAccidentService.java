package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.IndustrialAccidentCreateRequest;
import com.penocean.ehs.dto.response.IndustrialAccidentDetailResponse;
import com.penocean.ehs.dto.response.IndustrialAccidentListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.CompanyMapper;
import com.penocean.ehs.mapper.IndustrialAccidentMapper;
import com.penocean.ehs.model.Company;
import com.penocean.ehs.model.IndustrialAccident;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class IndustrialAccidentService {

    private static final Set<String> ACCIDENT_TYPES = Set.of("FALL", "STRUCK", "CUT", "BURN", "ELECTRIC", "OTHER");
    private static final Set<String> SEVERITIES = Set.of("MINOR", "SERIOUS", "FATAL");

    private final IndustrialAccidentMapper industrialAccidentMapper;
    private final CompanyMapper companyMapper;

    @Transactional(readOnly = true)
    public PageResponse<IndustrialAccidentListItem> list(Long companyId, String businessNumber,
                                                         String severity, String accidentType,
                                                         LocalDate dateFrom, LocalDate dateTo,
                                                         int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;

        Long effectiveCompanyId = companyId;
        if (isContractor(caller)) {
            effectiveCompanyId = caller.getCompanyId();
            if (effectiveCompanyId == null) {
                return PageResponse.of(java.util.Collections.emptyList(), 0, p, s);
            }
        }

        return PageResponse.of(
                industrialAccidentMapper.findPage(effectiveCompanyId, businessNumber, severity,
                        accidentType, dateFrom, dateTo, offset, s),
                industrialAccidentMapper.count(effectiveCompanyId, businessNumber, severity,
                        accidentType, dateFrom, dateTo),
                p, s);
    }

    @Transactional(readOnly = true)
    public IndustrialAccidentDetailResponse detail(Long id, User caller) {
        IndustrialAccidentDetailResponse detail = industrialAccidentMapper.findByIdWithDetail(id);
        if (detail == null) {
            throw new ResourceNotFoundException("IndustrialAccident", "id", id);
        }
        checkViewPermission(detail.getCompanyId(), caller);
        return detail;
    }

    @Transactional
    public Long create(IndustrialAccidentCreateRequest request, User caller) {
        validateCreate(request);

        // business_number → company_id 자동 매칭 (없으면 null)
        Long companyId = null;
        if (request.getBusinessNumber() != null && !request.getBusinessNumber().isBlank()) {
            Company c = companyMapper.findByBusinessNumber(request.getBusinessNumber());
            if (c == null) {
                log.warn("Company not found by businessNumber={}, accident will be stored without companyId",
                        request.getBusinessNumber());
            } else {
                companyId = c.getId();
            }
        }

        IndustrialAccident entity = IndustrialAccident.builder()
                .accidentNo(generateAccidentNo())
                .companyId(companyId)
                .businessNumber(request.getBusinessNumber())
                .vesselId(request.getVesselId())
                .accidentDate(request.getAccidentDate())
                .accidentLocation(request.getAccidentLocation())
                .victimName(request.getVictimName())
                .victimAge(request.getVictimAge())
                .victimGender(request.getVictimGender())
                .victimRole(request.getVictimRole())
                .accidentType(request.getAccidentType() == null ? null : request.getAccidentType().toUpperCase())
                .severity(request.getSeverity() == null ? null : request.getSeverity().toUpperCase())
                .description(request.getDescription())
                .treatmentDays(request.getTreatmentDays())
                .absenceDays(request.getAbsenceDays())
                .reportedBy(caller.getId())
                .build();

        try {
            industrialAccidentMapper.insert(entity);
        } catch (DuplicateKeyException dup) {
            entity.setAccidentNo(generateAccidentNo());
            industrialAccidentMapper.insert(entity);
        }

        log.info("IndustrialAccident created: id={}, no={}, companyId={}, by={}",
                entity.getId(), entity.getAccidentNo(), companyId, caller.getId());
        return entity.getId();
    }

    @Transactional
    public void update(Long id, IndustrialAccidentCreateRequest request, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("수정 권한이 없습니다.");
        }
        IndustrialAccident entity = loadEntity(id);
        validateCreate(request);

        entity.setBusinessNumber(request.getBusinessNumber());
        entity.setVesselId(request.getVesselId());
        entity.setAccidentDate(request.getAccidentDate());
        entity.setAccidentLocation(request.getAccidentLocation());
        entity.setVictimName(request.getVictimName());
        entity.setVictimAge(request.getVictimAge());
        entity.setVictimGender(request.getVictimGender());
        entity.setVictimRole(request.getVictimRole());
        entity.setAccidentType(request.getAccidentType() == null ? null : request.getAccidentType().toUpperCase());
        entity.setSeverity(request.getSeverity() == null ? null : request.getSeverity().toUpperCase());
        entity.setDescription(request.getDescription());
        entity.setTreatmentDays(request.getTreatmentDays());
        entity.setAbsenceDays(request.getAbsenceDays());

        industrialAccidentMapper.update(entity);
        log.info("IndustrialAccident updated: id={}, by={}", id, caller.getId());
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("삭제 권한이 없습니다.");
        }
        loadEntity(id);
        industrialAccidentMapper.softDelete(id);
        log.info("IndustrialAccident soft-deleted: id={}, by={}", id, caller.getId());
    }

    @Transactional
    public void uploadReport(Long id, String fileUrl, User caller) {
        IndustrialAccident entity = loadEntity(id);
        // PPT slide 28: 업체(자사 건에 한해) 또는 계약부서/관리자가 업로드 가능
        if (isAdminOrContractDept(caller)) {
            // OK
        } else if (isContractor(caller)
                && caller.getCompanyId() != null
                && caller.getCompanyId().equals(entity.getCompanyId())) {
            // 자기 회사 건에 한해 업로드 허용
        } else {
            throw new UnauthorizedException("권한이 없습니다.");
        }
        industrialAccidentMapper.updateReportFileUrl(id, fileUrl);
        log.info("IndustrialAccident report uploaded: id={}, url={}, by={}",
                id, fileUrl, caller.getId());
    }

    // ---------- helpers ----------

    private IndustrialAccident loadEntity(Long id) {
        IndustrialAccident e = industrialAccidentMapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("IndustrialAccident", "id", id);
        return e;
    }

    private void validateCreate(IndustrialAccidentCreateRequest request) {
        if (request == null) throw new BadRequestException("요청 바디가 비어있습니다.");
        if (request.getAccidentDate() == null) throw new BadRequestException("accidentDate는 필수입니다.");
        if (request.getVictimName() == null || request.getVictimName().isBlank()) {
            throw new BadRequestException("victimName은 필수입니다.");
        }
        if (request.getAccidentType() == null
                || !ACCIDENT_TYPES.contains(request.getAccidentType().toUpperCase())) {
            throw new BadRequestException("accidentType은 FALL/STRUCK/CUT/BURN/ELECTRIC/OTHER 이어야 합니다.");
        }
        if (request.getSeverity() == null
                || !SEVERITIES.contains(request.getSeverity().toUpperCase())) {
            throw new BadRequestException("severity는 MINOR/SERIOUS/FATAL 이어야 합니다.");
        }
    }

    private String generateAccidentNo() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer max = industrialAccidentMapper.findMaxSeqByDate(date);
        int next = (max == null ? 0 : max) + 1;
        return String.format("IA-%s-%04d", date, next);
    }

    private void checkViewPermission(Long companyId, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller) && companyId != null && companyId.equals(caller.getCompanyId())) return;
        throw new UnauthorizedException("조회 권한이 없습니다.");
    }

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String role = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(role) || "CONTRACT_DEPT".equals(role);
    }
}
