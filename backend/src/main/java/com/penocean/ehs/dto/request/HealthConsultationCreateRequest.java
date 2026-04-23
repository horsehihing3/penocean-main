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
public class HealthConsultationCreateRequest {

    private Long userId;
    private LocalDate consultationDate;
    private String consultantName;
    private String topic;
    private String content;
    private String actionItems;
}
