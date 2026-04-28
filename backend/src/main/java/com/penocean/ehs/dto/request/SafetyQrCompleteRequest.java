package com.penocean.ehs.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SafetyQrCompleteRequest {
    private Long workerId;       // [2026-04-27] tb_access_worker.id (선택 시 교육완료 상태 업데이트)
    private String workerName;
    private String vesselName;
    private LocalDate workDate;
    private String gender;
    private String phone;
}
