package com.penocean.ehs.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SafetyQrResponse {
    private Long id;
    private String token;
    private String title;
    private String vesselName;
    private String content;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private int recordCount;
}
