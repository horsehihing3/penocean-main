package com.penocean.ehs.dto.response;

// [2026-05-02] 비로그인 파일 업로드 페이지용 토큰 정보 응답
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadTokenInfoResponse {
    private Long accessRequestId;
    private String requestNo;
    private String companyName;
    private String vesselName;
    private String workType;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    private String status;
}
