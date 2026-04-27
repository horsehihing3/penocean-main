package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthVital {

    private Long id;
    private Long checkupId;
    private Long userId;
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
    private BigDecimal waistCm;

    private String smoking;             // NONE / PAST / CURRENT
    private Integer drinkingPerWeek;

    private Boolean isHypertension;
    private Boolean isDiabetes;
    private Boolean isDyslipidemia;

    private LocalDateTime createdAt;
}
