package com.penocean.ehs.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    /** PPT slide 6: 아이디(별도 필드). null 이면 email 을 username 으로 사용 (하위 호환) */
    private String username;

    @NotBlank(message = "업체명은 필수 입력입니다")
    private String companyName;

    /** PPT slide 6: 업체 영문명 */
    private String companyNameEn;

    @NotBlank(message = "사업자번호는 필수 입력입니다")
    @Pattern(regexp = "^\\d{3}-\\d{2}-\\d{5}$", message = "사업자번호 형식이 올바르지 않습니다 (000-00-00000)")
    private String businessNumber;

    /** PPT slide 6: 사업자등록증 파일 경로 (선업로드 후 경로만 전달) */
    private String businessLicenseFilePath;

    /** PPT slide 6: 회사전화번호 (안전담당자 휴대전화와 구분) */
    private String companyPhone;

    /** 우편번호 / 주소 / 상세주소 */
    private String postalCode;
    private String address;
    private String addressDetail;

    @NotBlank(message = "담당자명은 필수 입력입니다")
    private String contactName;

    /** PPT slide 6: 안전담당자 직책 */
    private String contactTitle;

    @NotBlank(message = "이메일은 필수 입력입니다")
    @Email(message = "이메일 형식이 올바르지 않습니다")
    private String email;

    @NotBlank(message = "연락처는 필수 입력입니다")
    private String phone;

    @NotBlank(message = "비밀번호는 필수 입력입니다")
    @Size(min = 8, max = 100, message = "비밀번호는 8~100자")
    private String password;

    @NotEmpty(message = "업종은 한 개 이상 선택해야 합니다")
    private List<String> industryCodes;          // tb_code.group_code='INDUSTRY' (복수)

    /** PPT slide 6: 기타업종 (자유 입력) */
    private String industryOther;

    @NotEmpty(message = "계약팀은 한 개 이상 선택해야 합니다")
    // [2026-08-04] 개인정보 수집·이용 동의 (PPT 5p) — 미동의 시 가입 불가
    private Boolean privacyAgreed;
    private Boolean over14Agreed;

    private List<String> contractDepartments;    // tb_department.code (복수)
}
