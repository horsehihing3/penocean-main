package com.penocean.ehs.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ProcedureDocResponse {
    private Long id;
    private String procType;
    private String fileName;
    private Long fileSize;
    private String mimeType;
    private Long uploadedBy;
    private String uploaderName;
    private LocalDateTime createdAt;
}
