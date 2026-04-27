package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.HealthCheckupCreateRequest;
import com.penocean.ehs.dto.request.HealthVitalInput;
import com.penocean.ehs.dto.response.HealthCheckupDetailResponse;
import com.penocean.ehs.dto.response.HealthCheckupListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.HealthCheckupMapper;
import com.penocean.ehs.mapper.HealthVitalMapper;
import com.penocean.ehs.model.HealthCheckup;
import com.penocean.ehs.model.HealthVital;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthCheckupService {

    private final HealthCheckupMapper checkupMapper;
    private final HealthVitalMapper vitalMapper;

    @Transactional(readOnly = true)
    public PageResponse<HealthCheckupListItem> list(Long userId, Long companyId, String checkupType,
                                                    LocalDate dateFrom, LocalDate dateTo,
                                                    int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;

        Long effectiveUserId = userId;
        if (isContractor(caller)) {
            effectiveUserId = caller.getId();
        }

        List<HealthCheckupListItem> content = checkupMapper.findPage(
                effectiveUserId, companyId, checkupType, dateFrom, dateTo, offset, s);
        long total = checkupMapper.count(effectiveUserId, companyId, checkupType, dateFrom, dateTo);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public HealthCheckupDetailResponse detail(Long id, User caller) {
        HealthCheckupDetailResponse detail = checkupMapper.findByIdWithDetail(id);
        if (detail == null) throw new ResourceNotFoundException("HealthCheckup", "id", id);
        checkViewPermission(detail.getUserId(), caller);
        detail.setVitals(vitalMapper.findByCheckup(id));
        return detail;
    }

    @Transactional
    public Long create(HealthCheckupCreateRequest request, String reportFileUrl, User caller) {
        if (request == null) throw new BadRequestException("요청이 비어있습니다.");
        if (request.getCheckupDate() == null) throw new BadRequestException("checkupDate는 필수입니다.");
        Long userId = request.getUserId() != null ? request.getUserId() : caller.getId();

        HealthCheckup entity = HealthCheckup.builder()
                .userId(userId)
                .companyId(request.getCompanyId() != null ? request.getCompanyId() : caller.getCompanyId())
                .checkupDate(request.getCheckupDate())
                .hospitalName(request.getHospitalName())
                .checkupType(normalizeType(request.getCheckupType()))
                .summary(request.getSummary())
                .reportFileUrl(reportFileUrl != null ? reportFileUrl : request.getReportFileUrl())
                .uploadedBy(caller.getId())
                .build();
        checkupMapper.insert(entity);

        if (request.getVitals() != null) {
            insertVital(entity.getId(), userId, request.getVitals());
        }
        log.info("HealthCheckup created: id={}, userId={}", entity.getId(), userId);
        return entity.getId();
    }

    @Transactional
    public Long addVital(Long checkupId, HealthVitalInput input, User caller) {
        HealthCheckup entity = loadEntity(checkupId);
        checkWritePermission(entity.getUserId(), caller);
        return insertVital(checkupId, entity.getUserId(), input);
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        HealthCheckup entity = loadEntity(id);
        checkWritePermission(entity.getUserId(), caller);
        checkupMapper.softDelete(id);
        log.info("HealthCheckup soft-deleted: id={}", id);
    }

    // ----- helpers -----

    private Long insertVital(Long checkupId, Long userId, HealthVitalInput in) {
        HealthVital v = HealthVital.builder()
                .checkupId(checkupId)
                .userId(userId)
                .measuredDate(in.getMeasuredDate() != null ? in.getMeasuredDate() : LocalDate.now())
                .systolicBp(in.getSystolicBp())
                .diastolicBp(in.getDiastolicBp())
                .fastingGlucose(in.getFastingGlucose())
                .hba1c(in.getHba1c())
                .totalCholesterol(in.getTotalCholesterol())
                .ldl(in.getLdl())
                .hdl(in.getHdl())
                .triglyceride(in.getTriglyceride())
                .bmi(in.getBmi())
                .waistCm(in.getWaistCm())
                .smoking(in.getSmoking())
                .drinkingPerWeek(in.getDrinkingPerWeek())
                .isHypertension(flagHypertension(in))
                .isDiabetes(flagDiabetes(in))
                .isDyslipidemia(flagDyslipidemia(in))
                .build();
        vitalMapper.insert(v);
        return v.getId();
    }

    private boolean flagHypertension(HealthVitalInput in) {
        if (in.getSystolicBp() != null && in.getSystolicBp() >= 140) return true;
        return in.getDiastolicBp() != null && in.getDiastolicBp() >= 90;
    }

    private boolean flagDiabetes(HealthVitalInput in) {
        if (in.getFastingGlucose() != null && in.getFastingGlucose() >= 126) return true;
        return in.getHba1c() != null && in.getHba1c().compareTo(new BigDecimal("6.5")) >= 0;
    }

    private boolean flagDyslipidemia(HealthVitalInput in) {
        if (in.getLdl() != null && in.getLdl() >= 160) return true;
        return in.getTotalCholesterol() != null && in.getTotalCholesterol() >= 240;
    }

    private String normalizeType(String t) {
        if (t == null || t.isBlank()) return "GENERAL";
        String up = t.toUpperCase();
        if (!"GENERAL".equals(up) && !"SPECIAL".equals(up) && !"PRE_EMPLOYMENT".equals(up)) {
            throw new BadRequestException("checkupType은 GENERAL/SPECIAL/PRE_EMPLOYMENT 이어야 합니다.");
        }
        return up;
    }

    private HealthCheckup loadEntity(Long id) {
        HealthCheckup e = checkupMapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("HealthCheckup", "id", id);
        return e;
    }

    private void checkViewPermission(Long ownerUserId, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller) && ownerUserId != null && ownerUserId.equals(caller.getId())) return;
        throw new UnauthorizedException("접근 권한이 없습니다.");
    }

    private void checkWritePermission(Long ownerUserId, User caller) {
        checkViewPermission(ownerUserId, caller);
    }

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String role = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(role) || "CONTRACT_DEPT".equals(role);
    }

    // used only to keep the compiler happy with unused lists import if needed
    @SuppressWarnings("unused")
    private static List<Object> emptyList() { return new ArrayList<>(); }
}
