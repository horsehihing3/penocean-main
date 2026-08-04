package com.penocean.ehs.dto.response;

import com.penocean.ehs.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String username;
    private String name;
    private String email;
    private String phone;
    private String role;              // ADMIN / CONTRACTOR / CONTRACT_DEPT
    private Long companyId;
    private String companyName;       // [2026-05-04] 회사명 (tb_company.name)
    private String industryName;      // [2026-05-04] 업종명 (코드 라벨 또는 기타)
    private Long departmentId;
    private String status;
    // [2026-08-04] 관리자 사용자 관리 화면용
    private String title;             // 직책
    private String departmentName;    // 계약부서명
    private LocalDateTime createdAt;
    private LocalDateTime lastLoginAt;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRoleCode())
                .companyId(user.getCompanyId())
                .departmentId(user.getDepartmentId())
                .status(user.getStatus())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }
}
