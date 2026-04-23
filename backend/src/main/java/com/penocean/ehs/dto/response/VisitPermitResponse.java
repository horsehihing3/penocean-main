package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VisitPermitResponse {

    private Long id;
    private String permitNo;
    private Long accessRequestId;
    private String accessRequestNo;
    private Long companyId;
    private String companyName;
    private Long vesselId;
    private String vesselName;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private String qrCodeUrl;
    private Long issuedBy;
    private LocalDateTime issuedAt;
    private Boolean revoked;
    private String revokedReason;
    private LocalDateTime revokedAt;
}
