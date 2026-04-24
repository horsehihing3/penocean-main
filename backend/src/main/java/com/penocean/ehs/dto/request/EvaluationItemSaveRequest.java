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
    private String referenceDoc;    // [2026-04-24] PPT 슬라이드 25: 첨부파일(참고서류)
    private Integer maxScore;
    private BigDecimal weight;
    private Integer sortOrder;
    private Boolean active;
}
