package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerVoiceListItem {

    private Long id;
    private String voiceNo;
    private String voiceType;
    private String title;
    private Long companyId;
    private String companyName;
    private String severity;
    private String status;
    private Boolean reporterAnonymous;
    private LocalDateTime createdAt;
}
