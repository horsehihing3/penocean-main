package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationUpdateRequest {

    private String comment;
    private BigDecimal qualificationThreshold;
    private List<EvaluationCreateRequest.ItemScoreInput> itemScores;
}
