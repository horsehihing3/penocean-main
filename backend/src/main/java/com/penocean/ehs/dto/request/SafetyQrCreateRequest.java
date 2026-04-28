package com.penocean.ehs.dto.request;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SafetyQrCreateRequest {
    // [2026-04-27] vesselName 제거 — QR은 공통 단일 코드로 운용
    private String title;
    private String content;
    private LocalDateTime expiresAt;
}
