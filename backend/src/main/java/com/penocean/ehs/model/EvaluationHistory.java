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
public class EvaluationHistory {

    private Long id;
    private Long evaluationId;
    private Long improvementId;
    private String action;
    private Long actorUserId;
    private String actorName;
    private String detail;
    private LocalDateTime createdAt;
}
