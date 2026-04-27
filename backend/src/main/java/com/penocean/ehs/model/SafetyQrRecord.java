package com.penocean.ehs.model;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SafetyQrRecord {
    private Long id;
    private Long qrId;
    private String workerName;
    private String vesselName;
    private LocalDate workDate;
    private String gender;
    private String phone;
    private LocalDateTime completedAt;
}
