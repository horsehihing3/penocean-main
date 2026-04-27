package com.penocean.ehs.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SafetyQrCreateRequest {
    private String title;
    private String vesselName;
    private String content;
    private LocalDateTime expiresAt;
}
