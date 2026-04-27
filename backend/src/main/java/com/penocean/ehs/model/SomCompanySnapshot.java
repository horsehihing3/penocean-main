package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SomCompanySnapshot {

    private Long id;
    private String businessNumber;
    private String companyName;
    private String ceoName;
    private String address;
    private String industry;
    private Integer employeeCount;
    private BigDecimal annualRevenue;
    private LocalDateTime lastSyncedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
