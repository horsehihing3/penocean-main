package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeaCrewIncidentBulkRequest {

    private String excelUploadId;
    private List<Item> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {
        private Long vesselId;
        private Integer periodYear;
        private Integer periodMonth;
        private String crewName;
        private String crewRole;
        private String incidentType;       // ILLNESS / INJURY
        private LocalDate incidentDate;
        private String diagnosis;
        private Boolean evacuationRequired;
        private LocalDate returnToDutyDate;
    }
}
