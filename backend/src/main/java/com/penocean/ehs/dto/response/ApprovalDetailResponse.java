package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalDetailResponse {

    private Long userId;
    private String username;
    private String name;
    private String email;
    private String phone;
    private Long companyId;
    private String companyName;
    private String businessNumber;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private Long approvedBy;

    private List<String> industries;                 // industry codes
    private List<DepartmentRef> contractDepartments; // [{code, name}]

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentRef {
        private String code;
        private String name;
    }
}
