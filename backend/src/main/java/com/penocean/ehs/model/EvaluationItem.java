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
public class EvaluationItem {

    private Long id;
    private String code;
    private String category;
    private String title;
    private String description;
    private String referenceDoc;    // [2026-04-24] PPT 슬라이드 25: 첨부파일(참고서류)
    private Integer maxScore;
    private BigDecimal weight;
    private Integer sortOrder;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
