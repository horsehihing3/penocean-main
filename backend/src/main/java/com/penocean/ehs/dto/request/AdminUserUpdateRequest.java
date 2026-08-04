// 관리자 사용자 정보 수정 요청 (비밀번호는 별도 API 로 분리)
package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminUserUpdateRequest {

    private String name;
    private String title;
    private String email;
    private String phone;

    /** ADMIN / CONTRACTOR / CONTRACT_DEPT */
    private String roleCode;

    /** PENDING / APPROVED / REJECTED / INACTIVE */
    private String status;
}
