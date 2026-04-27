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
public class DailySafetyLogCreateRequest {

    private Long vesselId;
    private Long companyId;
    private LocalDate logDate;
    private String representativeName;
    private Integer attendeesCount;
    private String trainingContent;
    private String scannedFileUrl;
    private String kakaoMessageId;
    /** KAKAO / EMAIL / UPLOAD (default UPLOAD) */
    private String receivedVia;
}
