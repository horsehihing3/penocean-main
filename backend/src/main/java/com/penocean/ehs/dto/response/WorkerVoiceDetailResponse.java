package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerVoiceDetailResponse {

    private Long id;
    private String voiceNo;
    private String voiceType;
    private String title;
    private String content;
    private Long companyId;
    private String companyName;
    private Long vesselId;
    private String vesselName;
    private Long reporterUserId;
    private String reporterName;
    private Boolean reporterAnonymous;
    private String severity;
    private String status;
    private Long assignedTo;
    private String assigneeName;
    private LocalDateTime resolvedAt;
    private String resolution;
    private String emailSentTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<AttachmentItem> attachments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttachmentItem {
        private Long id;
        private String fileName;
        private String filePath;
        private Long fileSize;
        private String mimeType;
        private Long uploadedBy;
        private LocalDateTime uploadedAt;
    }
}
