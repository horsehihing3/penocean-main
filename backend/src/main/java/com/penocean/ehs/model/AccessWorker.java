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
public class AccessWorker {

    private Long id;
    private Long accessRequestId;
    private String workerName;
    private LocalDate workerBirth;
    private String workerPhone;
    private String workerRole;
    private Boolean safetyEduCompleted;
    private LocalDateTime safetyEduCompletedAt;
    private String safetyEduCertificateUrl;
    private Boolean checkByShip;
    private LocalDateTime checkByShipAt;
    private Long checkByShipUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
