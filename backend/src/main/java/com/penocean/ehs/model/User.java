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
    private String rejectionReason;   // 반려 사유
    private String reapplyToken;      // 재가입 링크 토큰 (UUID)
    private LocalDateTime approvedAt;
    private Long approvedBy;
    private LocalDateTime lastLoginAt;
    // [2026-08-04] 개인정보 수집·이용 동의 (PPT 5p)
    private Boolean privacyAgreed;    // [필수] 개인정보 수집·이용 동의
    private Boolean over14Agreed;     // 만 14세 이상 확인
    private LocalDateTime privacyAgreedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
