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
public class EvaluationItemScore {

    private Long id;
    private Long evaluationId;
    private Long itemId;
    private BigDecimal score;
    private BigDecimal maxScore;
    private BigDecimal weight;
    private BigDecimal weightedScore;
    private Boolean notApplicable;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
