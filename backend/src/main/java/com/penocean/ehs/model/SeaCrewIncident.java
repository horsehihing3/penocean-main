package com.penocean.ehs.model;

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
public class SeaCrewIncident {

    private Long id;
    private Long vesselId;
    private Integer periodYear;
    private Integer periodMonth;
    private String crewName;
    private String crewRole;
    private String incidentType;            // ILLNESS / INJURY
    private LocalDate incidentDate;
    private String diagnosis;
    private Boolean evacuationRequired;
    private LocalDate returnToDutyDate;
    private String excelUploadId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
