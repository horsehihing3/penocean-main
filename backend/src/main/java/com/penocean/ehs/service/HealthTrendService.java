package com.penocean.ehs.service;

import com.penocean.ehs.dto.response.HealthTrendResponse;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.HealthVitalMapper;
import com.penocean.ehs.model.HealthVital;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthTrendService {

    private final HealthVitalMapper vitalMapper;

    @Transactional(readOnly = true)
    public HealthTrendResponse getTrend(Long userId, Integer years, User caller) {
        int yrs = (years == null || years <= 0) ? 3 : years;

        Long effectiveUserId = userId;
        if (isContractor(caller)) {
            effectiveUserId = caller.getId();   // CONTRACTOR 는 자신만
        } else if (effectiveUserId == null) {
            effectiveUserId = caller.getId();
        }

        if (!isAdminOrContractDept(caller) && !caller.getId().equals(effectiveUserId)) {
            throw new UnauthorizedException("본인 건강추이만 조회할 수 있습니다.");
        }

        LocalDate to = LocalDate.now();
        LocalDate from = to.minusYears(yrs);

        List<HealthVital> vitals = vitalMapper.findByUserDateRange(
                effectiveUserId, from, to, null, null, null);

        List<HealthTrendResponse.TrendPoint> points = new ArrayList<>();
        for (HealthVital v : vitals) {
            LocalDate md = v.getMeasuredDate();
            points.add(HealthTrendResponse.TrendPoint.builder()
                    .year(md != null ? md.getYear() : null)
                    .month(md != null ? md.getMonthValue() : null)
                    .measuredDate(md)
                    .systolicBp(v.getSystolicBp())
                    .diastolicBp(v.getDiastolicBp())
                    .fastingGlucose(v.getFastingGlucose())
                    .hba1c(v.getHba1c())
                    .totalCholesterol(v.getTotalCholesterol())
                    .ldl(v.getLdl())
                    .hdl(v.getHdl())
                    .triglyceride(v.getTriglyceride())
                    .bmi(v.getBmi())
                    .build());
        }

        long ht = vitalMapper.countByFlag(effectiveUserId, from, to, "HYPERTENSION");
        long db = vitalMapper.countByFlag(effectiveUserId, from, to, "DIABETES");
        long dl = vitalMapper.countByFlag(effectiveUserId, from, to, "DYSLIPIDEMIA");

        return HealthTrendResponse.builder()
                .userId(effectiveUserId)
                .years(yrs)
                .points(points)
                .flagCount(HealthTrendResponse.FlagCount.builder()
                        .hypertension(ht).diabetes(db).dyslipidemia(dl).build())
                .build();
    }

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String r = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(r) || "CONTRACT_DEPT".equals(r);
    }
}
