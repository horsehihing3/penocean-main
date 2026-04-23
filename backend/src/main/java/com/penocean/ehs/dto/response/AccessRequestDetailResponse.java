package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessRequestDetailResponse {

    private Long id;
    private String requestNo;
    private Long companyId;
    private String companyName;
    private Long vesselId;
    private String vesselName;
    private Long portId;
    private String workType;
    private String workDescription;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    private Integer workerCount;
    private String status;
    private Long submittedBy;
    private LocalDateTime submittedAt;
    private Long reviewedBy;
    private LocalDateTime reviewedAt;
    private String improvementRequestReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<WorkerItem> workers;
    private List<AttachmentItem> attachments;
    private List<ReviewLogItem> reviewLogs;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkerItem {
        private Long id;
        private String workerName;
        private LocalDate workerBirth;
        private String workerPhone;
        private String workerRole;
        private Boolean safetyEduCompleted;
        private LocalDateTime safetyEduCompletedAt;
        private String safetyEduCertificateUrl;
        private Boolean checkByShip;
        private LocalDateTime checkByShipAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentItem {
        private Long id;
        private String attachmentType;
        private String fileName;
        private String filePath;
        private Long fileSize;
        private String mimeType;
        private Long uploadedBy;
        private LocalDateTime uploadedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewLogItem {
        private Long id;
        private String action;
        private String comment;
        private Long actorUserId;
        private String actorName;
        private LocalDateTime actedAt;
    }
}
