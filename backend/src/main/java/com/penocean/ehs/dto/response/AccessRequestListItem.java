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
public class AccessRequestListItem {

    private Long id;
    private String requestNo;
    private Long companyId;
    private String companyName;
    private Long vesselId;
    private String vesselName;
    private String portName;        // [2026-04-23] PPT 슬라이드 13: 지역/항구 컬럼 추가
    private String industryName;    // [2026-04-23] PPT 슬라이드 13: 업종 컬럼 추가 (tb_code_master)
    private String workType;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    private Integer workerCount;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
}
