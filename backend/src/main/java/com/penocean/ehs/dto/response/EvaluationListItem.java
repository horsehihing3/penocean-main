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
public class EvaluationListItem {

    private Long id;
    private String evaluationNo;
    private Long companyId;
    private String companyName;
    private String businessNumber;
    private Integer periodYear;
    private String periodHalf;
    private String evaluationType;
    private String status;
    private BigDecimal totalScore;
    private BigDecimal maxTotalScore;
    private BigDecimal scorePercentage;
    private Boolean qualified;
    private Integer attachmentCount;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
}
