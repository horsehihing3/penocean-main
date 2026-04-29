package com.penocean.ehs.dto.response;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SafetyQrRecordResponse {
    private Long id;
    private Long qrId;
    private String qrTitle;
    private String workerName;
    private String vesselName;
    private LocalDate workDate;
    private String phone;
    private LocalDateTime completedAt;
}
