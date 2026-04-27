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
public class IndustrialAccidentCreateRequest {

    private String businessNumber;
    private Long vesselId;
    private LocalDate accidentDate;
    private String accidentLocation;
    private String victimName;
    private Integer victimAge;
    private String victimGender;
    private String victimRole;
    private String accidentType;        // FALL / STRUCK / CUT / BURN / ELECTRIC / OTHER
    private String severity;            // MINOR / SERIOUS / FATAL
    private String description;
    private Integer treatmentDays;
    private Integer absenceDays;
}
