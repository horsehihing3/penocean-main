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
public class AccessAttachment {

    private Long id;
    private Long accessRequestId;
    private String attachmentType;      // RISK_ASSESSMENT / PLEDGE / WORK_PLAN / OTHER
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
    private Boolean deleted;
}
