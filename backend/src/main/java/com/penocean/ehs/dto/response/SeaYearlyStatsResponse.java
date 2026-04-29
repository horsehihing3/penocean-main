package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// [2026-04-30] 해상직원 질병/부상 연도별 집계 통계
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeaYearlyStatsResponse {
    private int year;
    private int vesselCount;
    private int illnessTotal;
    private int injuryTotal;
    private int incidentTotal;
    private double incidentRate; // (illness+injury) / vesselCount (%)
}
