package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitPermit {

    private Long id;
    private String permitNo;            // VP-YYYYMMDD-NNNN
    private Long accessRequestId;
    private Long vesselId;
    private Long companyId;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private String qrCodeUrl;
    private Long issuedBy;
    private LocalDateTime issuedAt;
    private Boolean revoked;
    private String revokedReason;
    private LocalDateTime revokedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
