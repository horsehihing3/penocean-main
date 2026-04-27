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
public class AccessReviewLog {

    private Long id;
    private Long accessRequestId;
    private String action;              // REVIEW_START / IMPROVEMENT_REQUEST / APPROVE / REJECT
    private String comment;
    private Long actorUserId;
    private LocalDateTime actedAt;
    private LocalDateTime createdAt;
}
