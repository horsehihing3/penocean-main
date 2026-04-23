package com.penocean.ehs.model;

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
public class SafetyPerformanceLand {

    private Long id;
    private Long departmentId;
    private Integer periodYear;
    private Integer periodMonth;
    private BigDecimal manhours;
    private Integer accidentCount;
    private Integer lostTimeCount;
    private Integer fatalityCount;
    private BigDecimal trir;                // accident_count * 200000 / manhours
    private BigDecimal ltir;                // lost_time_count * 200000 / manhours
    private BigDecimal budgetPlanned;
    private BigDecimal budgetUsed;
    private String fcmProjectCode;
    private String vbpProjectCode;
    private Long reportedBy;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
