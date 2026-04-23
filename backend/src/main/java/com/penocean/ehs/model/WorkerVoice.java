package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerVoice {

    private Long id;
    private String voiceNo;                 // WV-YYYYMMDD-NNNN
    private String voiceType;               // NEAR_MISS / INCIDENT / INQUIRY
    private String title;
    private String content;
    private Long companyId;
    private Long vesselId;
    private Long reporterUserId;
    private Boolean reporterAnonymous;
    private String severity;                // LOW / MEDIUM / HIGH / CRITICAL
    private String status;                  // SUBMITTED / TRIAGED / IN_PROGRESS / RESOLVED / CLOSED
    private Long assignedTo;
    private LocalDateTime resolvedAt;
    private String resolution;
    private String emailSentTo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
