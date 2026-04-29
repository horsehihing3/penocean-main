package com.penocean.ehs.model;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class SafetyQrRecord {
    private Long id;
    private Long qrId;
    private Long workerId;       // [2026-04-27] tb_access_worker.id 연계
    private String workerName;
    private String vesselName;
    private LocalDate workDate;
    private String phone;
    private LocalDateTime completedAt;
}
