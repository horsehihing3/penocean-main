package com.penocean.ehs.dto.response;

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
public class CompanyListItem {

    private Long id;
    private String businessNumber;
    private String name;
    private String ceoName;
    private String phone;
    private String email;
    private String industryCode;
    private String status;
    private LocalDate contractStartDate;
    private LocalDate contractEndDate;
    private LocalDateTime createdAt;
}
