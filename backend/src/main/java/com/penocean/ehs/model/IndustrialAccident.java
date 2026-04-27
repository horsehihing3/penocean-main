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
public class IndustrialAccident {

    private Long id;
    private String accidentNo;              // IA-YYYYMMDD-NNNN
    private Long companyId;
    private String businessNumber;
    private Long vesselId;
    private LocalDate accidentDate;
    private String accidentLocation;
    private String victimName;
    private Integer victimAge;
    private String victimGender;            // M / F
    private String victimRole;
    private String accidentType;            // FALL / STRUCK / CUT / BURN / ELECTRIC / OTHER
    private String severity;                // MINOR / SERIOUS / FATAL
    private String description;
    private Integer treatmentDays;
    private Integer absenceDays;
    private Long reportedBy;
    private LocalDateTime reportedAt;
    private String reportFileUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
