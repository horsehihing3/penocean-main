package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthTrendResponse {

    private Long userId;
    private Integer years;
    private List<TrendPoint> points;
    private FlagCount flagCount;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TrendPoint {
        private Integer year;
        private Integer month;
        private LocalDate measuredDate;
        private Integer systolicBp;
        private Integer diastolicBp;
        private Integer fastingGlucose;
        private BigDecimal hba1c;
        private Integer totalCholesterol;
        private Integer ldl;
        private Integer hdl;
        private Integer triglyceride;
        private BigDecimal bmi;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FlagCount {
        private long hypertension;
        private long diabetes;
        private long dyslipidemia;
    }
}
