package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthVitalInput {

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
    private String smoking;
    private Integer drinkingPerWeek;
}
