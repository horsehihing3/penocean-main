package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyCreateRequest {

    private String businessNumber;
    private String name;
    private String nameEn;
    private String ceoName;
    private String postalCode;
    private String address;
    private String addressDetail;
    private String phone;
    private String email;
    private String industryCode;
    private String industryOther;
    private String status;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
}
