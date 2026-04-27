package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessRequest {

    private Long id;
    private String requestNo;           // AR-YYYYMMDD-NNNN
    private Long companyId;
    private Long vesselId;
    private Long portId;
    private String workType;
    private String workDescription;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    private Integer workerCount;
    private String status;              // DRAFT/SUBMITTED/IN_REVIEW/IMPROVEMENT_REQUESTED/APPROVED/REJECTED
    private Long submittedBy;
    private LocalDateTime submittedAt;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String improvementRequestReason;
    // [2026-04-23] PPT 슬라이드 14: 안전담당자 정보
    private String safetyManagerName;
    private String safetyManagerTel;
    private String safetyManagerEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
