package com.penocean.ehs.dto.response;

import com.penocean.ehs.model.HealthVital;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HealthCheckupDetailResponse {

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
    private Long uploadedBy;
    private LocalDateTime uploadedAt;
    private LocalDateTime createdAt;
    private List<HealthVital> vitals;
}
