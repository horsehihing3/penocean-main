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
public class EvaluationImprovement {

    private Long id;
    private Long evaluationId;
    private Long itemId;                 // null 허용
    private Long requestedBy;
    private LocalDateTime requestedAt;
    private String requestContent;
    private String responseContent;
    private Long responseUserId;
    private LocalDateTime respondedAt;
    private LocalDate responseDueDate;
    private String status;               // OPEN / RESPONDED / CLOSED / OVERDUE
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
