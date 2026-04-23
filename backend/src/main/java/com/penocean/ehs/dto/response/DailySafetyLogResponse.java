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
public class DailySafetyLogResponse {

    private Long id;
    private Long vesselId;
    private String vesselName;
    private Long companyId;
    private String companyName;
    private LocalDate logDate;
    private String representativeName;
    private Integer attendeesCount;
    private String trainingContent;
    private String scannedFileUrl;
    private String kakaoMessageId;
    private String receivedVia;
    private LocalDateTime createdAt;
}
