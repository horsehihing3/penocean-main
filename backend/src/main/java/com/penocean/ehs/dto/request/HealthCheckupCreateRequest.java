package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupCreateRequest {

    private Long userId;                // optional; defaults to caller
    private Long companyId;
    private LocalDate checkupDate;
    private String hospitalName;
    private String checkupType;         // GENERAL / SPECIAL / PRE_EMPLOYMENT
    private String summary;
    private String reportFileUrl;
    private HealthVitalInput vitals;    // optional — inline create
}
