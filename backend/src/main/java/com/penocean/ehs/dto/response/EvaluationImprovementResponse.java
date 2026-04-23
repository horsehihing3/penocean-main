package com.penocean.ehs.dto.response;

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
public class EvaluationImprovementResponse {

    private Long id;
    private Long evaluationId;
    private String evaluationNo;
    private Long companyId;
    private String companyName;
    private Long itemId;
    private String itemTitle;
    private Long requestedBy;
    private String requesterName;
    private LocalDateTime requestedAt;
    private String requestContent;
    private String responseContent;
    private Long responseUserId;
    private String responderName;
    private LocalDateTime respondedAt;
    private LocalDate responseDueDate;
    private String status;               // OPEN / RESPONDED / CLOSED / OVERDUE (dynamic)
    private LocalDateTime createdAt;
}
