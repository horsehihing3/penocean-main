package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeaCrewIncidentResponse {

    private Long id;
    private Long vesselId;
    private String vesselName;
    private Integer periodYear;
    private Integer periodMonth;
    private String crewName;
    private String crewRole;
    private String incidentType;
    private LocalDate incidentDate;
    private String diagnosis;
    private Boolean evacuationRequired;
    private LocalDate returnToDutyDate;
    private String excelUploadId;
    private LocalDateTime createdAt;
}
