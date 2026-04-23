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
public class DailySafetyLog {

    private Long id;
    private Long vesselId;
    private Long companyId;
    private LocalDate logDate;
    private String representativeName;
    private Integer attendeesCount;
    private String trainingContent;
    private String scannedFileUrl;
    private String kakaoMessageId;
    private String receivedVia;        // KAKAO / EMAIL / UPLOAD
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
