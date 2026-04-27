package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyPerformanceLandResponse {

    private Long id;
    private Long departmentId;
    private String departmentName;
    private Integer periodYear;
    private Integer periodMonth;
    private BigDecimal manhours;
    private Integer accidentCount;
    private Integer lostTimeCount;
    private Integer fatalityCount;
    private BigDecimal trir;
    private BigDecimal ltir;
    private BigDecimal budgetPlanned;
    private BigDecimal budgetUsed;
    private String fcmProjectCode;
    private String vbpProjectCode;
    private Long reportedBy;
    private String reporterName;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
