package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerVoiceCreateRequest {

    private String voiceType;       // NEAR_MISS / INCIDENT / INQUIRY
    private String title;
    private String content;
    private Long companyId;
    private Long vesselId;
    private Boolean anonymous;
    private String severity;        // LOW / MEDIUM / HIGH / CRITICAL
}
