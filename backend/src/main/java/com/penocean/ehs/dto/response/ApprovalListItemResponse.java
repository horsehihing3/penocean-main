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
public class ApprovalListItemResponse {

    private Long userId;
    private String username;
    private String name;
    private String email;
    private String phone;
    private Long companyId;
    private String companyName;
    private String businessNumber;
    private String status;            // PENDING / APPROVED / REJECTED / INACTIVE
    private LocalDateTime createdAt;
}
