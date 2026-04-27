package com.penocean.ehs.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SafetyQr {
    private Long id;
    private String token;
    private String title;
    private String vesselName;
    private String content;
    private Boolean isActive;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
}
