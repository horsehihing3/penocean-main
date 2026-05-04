package com.penocean.ehs.dto.response;

// [2026-05-04] 반려 재가입 토큰으로 기존 신청 정보 조회
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReapplyInfoResponse {
    private String username;
    private String companyName;
    private String companyNameEn;
    private String businessNumber;
    private String companyPhone;
    private String postalCode;
    private String address;
    private String addressDetail;
    private String contactName;
    private String contactTitle;
    private String email;
    private String phone;
    private List<String> industryCodes;
    private String industryOther;
    private List<String> contractDepartments;
    private String rejectionReason;
}
