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
public class AuditInspection {

    private Long id;
    private String inspectionType;      // REGULAR / SPECIAL / FOLLOW_UP
    private Long targetCompanyId;
    private Long targetVesselId;
    private LocalDate inspectionDate;
    private Long inspectorUserId;
    private String findings;
    private String actionItems;
    private String status;              // OPEN / CLOSED
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
