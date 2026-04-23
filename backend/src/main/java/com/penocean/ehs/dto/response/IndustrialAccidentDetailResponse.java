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
public class IndustrialAccidentDetailResponse {

    private Long id;
    private String accidentNo;
    private Long companyId;
    private String companyName;
    private String businessNumber;
    private Long vesselId;
    private String vesselName;
    private LocalDate accidentDate;
    private String accidentLocation;
    private String victimName;
    private Integer victimAge;
    private String victimGender;
    private String victimRole;
    private String accidentType;
    private String severity;
    private String description;
    private Integer treatmentDays;
    private Integer absenceDays;
    private Long reportedBy;
    private String reporterName;
    private LocalDateTime reportedAt;
    private String reportFileUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
