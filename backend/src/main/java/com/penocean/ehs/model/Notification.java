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
public class Notification {

    private Long id;
    private Long recipientUserId;
    private String channel;        // EMAIL / KAKAO / SYSTEM
    private String subject;
    private String body;
    private String status;         // PENDING / SENT / FAILED
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
    private Boolean deleted;
}
