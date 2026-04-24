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
    // [2026-04-24] PPT 슬라이드 22: 목록 컬럼 추가
    private String industryName;      // 업종 (tb_user_industry → tb_code 첫 번째)
    private String contractDeptName;  // 계약팀 (tb_user_department → tb_department 첫 번째)
}
