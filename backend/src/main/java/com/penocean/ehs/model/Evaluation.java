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
public class Evaluation {

    private Long id;
    private String evaluationNo;           // EV-YYYYNN-NNNN (NN = 01(H1) / 02(H2))
    private Long companyId;
    private Integer periodYear;
    private String periodHalf;             // H1 / H2
    private String evaluationType;         // REGULAR / SPECIAL
    private Long evaluatorUserId;
    private String status;                 // DRAFT / SUBMITTED / APPROVED / REJECTED
    private BigDecimal totalScore;
    private BigDecimal maxTotalScore;
    private BigDecimal scorePercentage;
    private Boolean qualified;
    private BigDecimal qualificationThreshold;
    private String comment;
    private LocalDateTime submittedAt;
    private Long approvedBy;
    private LocalDateTime approvedAt;
    private String rejectedReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
