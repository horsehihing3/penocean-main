// [2026-04-28] 건강검진 PDF 파서 결과 DTO
package com.penocean.ehs.health;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class ParsedHealthData {

    private String empName;
    private LocalDate birthDate;
    private String gender;
    private Integer age;
    private LocalDate checkupDate;
    private String hospitalName;

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

    // 혈액
    private BigDecimal hemoglobin;
    private Integer bst;
    private Integer tc;
    private Integer hdl;
    private Integer tg;
    private Integer ldl;
    private BigDecimal creatinine;
    private Integer egfr;
    private Integer ast;
    private Integer alt;
    private Integer ggt;

    /** 파서 식별자 (예: "NHIS") */
    private String parserType;
}
