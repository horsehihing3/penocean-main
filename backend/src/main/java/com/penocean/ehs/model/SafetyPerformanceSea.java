package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyPerformanceSea {

    private Long id;
    private Long vesselId;
    private Integer periodYear;
    private Integer periodMonth;
    private Integer crewCount;
    private Integer illnessCount;
    private Integer injuryCount;
    private Integer evacuationCount;
    private Integer sickLeaveDays;
    private LocalDateTime posSmSyncedAt;
    private String excelUploadId;
    private Long uploadedBy;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
