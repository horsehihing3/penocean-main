package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyPerformanceLandRequest {

    private Long departmentId;
    private Integer periodYear;
    private Integer periodMonth;
    private BigDecimal manhours;
    private Integer accidentCount;
    private Integer lostTimeCount;
    private Integer fatalityCount;
    private BigDecimal budgetPlanned;
    private BigDecimal budgetUsed;
    private String fcmProjectCode;
    private String vbpProjectCode;
    private String comment;
}
