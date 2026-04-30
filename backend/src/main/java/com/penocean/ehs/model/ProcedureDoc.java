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
public class ProcedureDoc {

    private Long id;
    /** 절차서 유형: ACCESS_SAFETY | RISK_ASSESSMENT */
    private String procType;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private Long uploadedBy;
    private LocalDateTime createdAt;
    private Boolean deleted;
}
