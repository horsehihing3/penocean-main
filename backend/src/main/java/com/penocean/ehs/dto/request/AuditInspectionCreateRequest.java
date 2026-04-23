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
public class AuditInspectionCreateRequest {

    private String inspectionType;      // REGULAR / SPECIAL / FOLLOW_UP
    private Long targetCompanyId;
    private Long targetVesselId;
    private LocalDate inspectionDate;
    private String findings;
    private String actionItems;
}
