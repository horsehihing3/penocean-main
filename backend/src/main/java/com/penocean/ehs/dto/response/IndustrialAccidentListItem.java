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
public class IndustrialAccidentListItem {

    private Long id;
    private String accidentNo;
    private Long companyId;
    private String companyName;
    private String businessNumber;
    private LocalDate accidentDate;
    private String accidentLocation;
    private String victimName;
    private String accidentType;
    private String severity;
    private LocalDateTime createdAt;
}
