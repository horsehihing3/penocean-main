package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationImprovementRequest {

    private Long evaluationId;
    private Long itemId;               // null 허용
    private String content;            // request_content
    private LocalDate responseDueDate;
}
