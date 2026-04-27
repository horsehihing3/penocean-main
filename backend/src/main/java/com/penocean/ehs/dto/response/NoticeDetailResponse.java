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
public class NoticeDetailResponse {

    private Long id;
    private String category;
    private String title;
    private String content;
    private Long authorUserId;
    private String authorName;
    private Boolean pinned;
    private Long viewCount;
    private LocalDateTime publishedAt;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
