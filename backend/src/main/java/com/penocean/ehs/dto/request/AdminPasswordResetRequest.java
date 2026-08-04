// 관리자에 의한 비밀번호 변경 요청. 평문은 저장·로그에 남기지 않는다.
package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminPasswordResetRequest {

    /** 새 비밀번호 (평문). 서버에서 BCrypt 해시로 변환 후 폐기한다. */
    private String newPassword;
}
