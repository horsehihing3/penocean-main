package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyPerformanceSeaRequest {

    private Long vesselId;
    private Integer periodYear;
    private Integer periodMonth;
    private Integer crewCount;
    private Integer illnessCount;
    private Integer injuryCount;
    private Integer evacuationCount;
    private Integer sickLeaveDays;
    private String excelUploadId;
    private String comment;
}
