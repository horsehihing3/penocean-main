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
public class EvaluationCreateRequest {

    private Long companyId;
    private Integer periodYear;
    private String periodHalf;             // H1 / H2
    private String evaluationType;         // REGULAR / SPECIAL
    private String comment;
    private BigDecimal qualificationThreshold;   // optional, default 60
    private List<ItemScoreInput> itemScores;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemScoreInput {
        private Long itemId;
        private BigDecimal score;
        /** PPT slide 20: 자료없음(Not Applicable) — true 일 때 점수/만점 모두에서 제외 */
        private Boolean notApplicable;
        private String comment;
    }
}
