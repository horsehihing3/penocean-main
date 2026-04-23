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
public class HealthCheckupListItem {

    private Long id;
    private Long userId;
    private String userName;
    private Long companyId;
    private String companyName;
    private LocalDate checkupDate;
    private String hospitalName;
    private String checkupType;
    private String summary;
    private String reportFileUrl;
    private LocalDateTime createdAt;
}
