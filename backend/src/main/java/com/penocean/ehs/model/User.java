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
public class User {

    private Long id;
    private String username;
    private String password;
    private String name;
    private String title;             // 직책 (안전담당자 직책 등)
    private String email;
    private String phone;
    private String roleCode;          // ADMIN / CONTRACTOR / CONTRACT_DEPT (FK -> tb_role.code)
    private Long companyId;           // FK -> tb_company.id (CONTRACTOR 한정)
    private Long departmentId;        // FK -> tb_department.id (CONTRACT_DEPT 한정)
    private String status;            // PENDING / APPROVED / REJECTED / INACTIVE
    private LocalDateTime approvedAt;
    private Long approvedBy;
    private LocalDateTime lastLoginAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
