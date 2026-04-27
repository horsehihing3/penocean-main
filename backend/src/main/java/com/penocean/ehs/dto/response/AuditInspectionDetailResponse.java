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
public class AuditInspectionDetailResponse {

    private Long id;
    private String inspectionType;
    private Long targetCompanyId;
    private String targetCompanyName;
    private Long targetVesselId;
    private String targetVesselName;
    private LocalDate inspectionDate;
    private Long inspectorUserId;
    private String inspectorName;
    private String findings;
    private String actionItems;
    private String status;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
