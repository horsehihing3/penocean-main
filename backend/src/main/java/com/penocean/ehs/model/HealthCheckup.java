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
public class HealthCheckup {

    private Long id;
    private Long userId;
    private Long companyId;
    private LocalDate checkupDate;
    private String hospitalName;
    private String checkupType;         // GENERAL / SPECIAL / PRE_EMPLOYMENT
    private String summary;
    private String reportFileUrl;
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
