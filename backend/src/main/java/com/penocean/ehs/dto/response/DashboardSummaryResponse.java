package com.penocean.ehs.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardSummaryResponse {

    /** ADMIN 이면 PENDING 유저 수, 그 외는 0 */
    private long pendingApprovalCount;

    /** 본인 가입 상태 (PENDING/REJECTED 인 경우만, 그 외 null) */
    private String myPendingRegistrationStatus;

    /** 사고율 상위 업체 (Phase 2 는 더미) */
    private List<HighIncidentCompany> highIncidentCompanies;

    /** 출입 요청 대기 (Phase 3) */
    private long pendingAccessRequests;

    /** 평가 대기 (Phase 3) */
    private long pendingEvaluations;

    /** 본인 수신 최근 알림 5건 */
    private List<NotificationBrief> recentNotifications;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HighIncidentCompany {
        private Long companyId;
        private String companyName;
        private Double incidentRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NotificationBrief {
        private Long id;
        private String subject;
        private LocalDateTime createdAt;
    }
}
