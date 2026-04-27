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
public class CompanyUpdateRequest {

    private String name;
    private String ceoName;
    private String address;
    private String phone;
    private String email;
    private String industryCode;
    private String status;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
}
