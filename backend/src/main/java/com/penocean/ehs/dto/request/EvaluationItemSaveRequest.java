package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationItemSaveRequest {

    private String code;
    private String category;
    private String title;
    private String description;
    private Integer maxScore;
    private BigDecimal weight;
    private Integer sortOrder;
    private Boolean active;
}
