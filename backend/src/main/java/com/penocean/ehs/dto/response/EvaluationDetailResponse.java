package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationDetailResponse {

    private Long id;
    private String evaluationNo;
    private Long companyId;
    private String companyName;
    private Integer periodYear;
    private String periodHalf;
    private String evaluationType;
    private Long evaluatorUserId;
    private String evaluatorName;
    private String status;
    private BigDecimal totalScore;
    private BigDecimal maxTotalScore;
    private BigDecimal scorePercentage;
    private Boolean qualified;
    private BigDecimal qualificationThreshold;
    private String comment;
    private LocalDateTime submittedAt;
    private Long approvedBy;
    private String approverName;
    private LocalDateTime approvedAt;
    private String rejectedReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<ItemScoreItem> itemScores;
    private List<AttachmentItem> attachments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItemScoreItem {
        private Long id;
        private Long itemId;
        private String itemCode;
        private String itemCategory;
        private String itemTitle;
        private BigDecimal score;
        private BigDecimal maxScore;
        private BigDecimal weight;
        private BigDecimal weightedScore;
        private Boolean notApplicable;
        private String comment;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentItem {
        private Long id;
        private Long itemId;
        private String fileName;
        private String filePath;
        private Long fileSize;
        private String mimeType;
        private Long uploadedBy;
        private LocalDateTime uploadedAt;
    }
}
