package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notice {

    private Long id;
    private String category;            // NOTICE / ANNOUNCEMENT / URGENT
    private String title;
    private String content;
    private Long authorUserId;
    private LocalDateTime publishedAt;
    private Boolean pinned;
    private Long viewCount;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
