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
    private LocalDateTime resolvedAt;   // [2026-04-24] PPT 슬라이드 16: 댓글(답변) 날짜
    private Integer commentCount;       // [2026-04-24] PPT 슬라이드 16: 댓글 수 (resolution 유무)
}
