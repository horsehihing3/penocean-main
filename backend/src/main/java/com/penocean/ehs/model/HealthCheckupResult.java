// [2026-04-28] 건강검진 결과 — PDF 파싱 후 저장되는 수치 모델
package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupResult {

    private Long id;
    private Integer checkupYear;
    private LocalDate checkupDate;
    private String hospitalName;
    private String department;
    private String empName;
    private LocalDate birthDate;
    private String gender;
    private Integer age;

    // 신체계측
    private BigDecimal height;
    private BigDecimal weight;
    private BigDecimal bmi;
    private BigDecimal waist;
    private BigDecimal visionRight;
    private BigDecimal visionLeft;

    // 혈압
    private Integer bpSystolic;
    private Integer bpDiastolic;
    private String bpCategory;
    private Boolean bpMed;

    // 혈액
    private BigDecimal hemoglobin;
    private Integer bst;
    private String dmCategory;
    private Boolean dmMed;

    // 이상지질혈증
    private Integer tc;
    private Integer hdl;
    private Integer tg;
    private Integer ldl;
    private String dlCategory;
    private Boolean dlMed;

    // 신장/간 기능
    private BigDecimal creatinine;
    private Integer egfr;
    private Integer ast;
    private Integer alt;
    private Integer ggt;

    // 사후관리
    private String followupOpinion;
    private String workFitness;
    private String note;

    // 메타
    private String parserType;
    private String sourceFile;
    private String createdBy;
    private LocalDateTime createdAt;
    private Boolean deleted;
}
