package com.penocean.ehs.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SafetyQrCompleteRequest {
    private String workerName;
    private String vesselName;
    private LocalDate workDate;
    private String gender;
    private String phone;
}
