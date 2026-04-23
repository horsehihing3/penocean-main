package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Company {

    private Long id;
    private String businessNumber;     // 사업자번호 (SOM 연동키)
    private String name;               // 업체명
    private String nameEn;             // 업체 영문명 (PPT slide 6)
    private String ceoName;            // 대표자명
    private String postalCode;         // 우편번호
    private String address;            // 주소
    private String addressDetail;      // 상세주소
    private String phone;
    private String email;
    private String industryCode;       // 업종코드 (tb_code group_code='INDUSTRY')
    private String industryOther;      // 기타업종 (자유 입력)
    private String businessLicenseFilePath; // 사업자등록증 파일 경로
    private String status;             // ACTIVE / INACTIVE / BLACKLIST
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
