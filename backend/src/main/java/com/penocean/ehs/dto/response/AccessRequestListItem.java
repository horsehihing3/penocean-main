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
    private String workType;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    private Integer workerCount;
    private String status;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
}
