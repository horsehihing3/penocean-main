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
public class HealthConsultation {

    private Long id;
    private Long userId;
    private LocalDate consultationDate;
    private String consultantName;
    private String topic;
    private String content;
    private String actionItems;
    private LocalDateTime createdAt;
    private Boolean deleted;
}
