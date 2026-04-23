package com.penocean.ehs.service;

import com.penocean.ehs.dto.response.DashboardSummaryResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.Notification;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse summary(String username) {
        User user = userMapper.findByUsername(username);
        if (user == null) {
            throw new ResourceNotFoundException("User not found: " + username);
        }

        boolean isAdmin = "ADMIN".equalsIgnoreCase(user.getRoleCode());

        long pendingApprovalCount = isAdmin
                ? userMapper.countByStatus("PENDING")
                : 0L;

        String myPendingStatus = null;
        if ("PENDING".equalsIgnoreCase(user.getStatus()) || "REJECTED".equalsIgnoreCase(user.getStatus())) {
            myPendingStatus = user.getStatus();
        }

        List<Notification> recent = notificationService.findRecentByUser(user.getId(), 5);
        List<DashboardSummaryResponse.NotificationBrief> recentBrief = recent.stream()
                .map(n -> DashboardSummaryResponse.NotificationBrief.builder()
                        .id(n.getId())
                        .subject(n.getSubject())
                        .createdAt(n.getCreatedAt())
                        .build())
                .toList();

        // TODO Phase 3: tb_accident 실데이터 기반 상위 업체 조회로 교체
        List<DashboardSummaryResponse.HighIncidentCompany> dummy = Arrays.asList(
                DashboardSummaryResponse.HighIncidentCompany.builder()
                        .companyId(1L).companyName("(주)해양안전기술").incidentRate(4.2).build(),
                DashboardSummaryResponse.HighIncidentCompany.builder()
                        .companyId(2L).companyName("대한선박정비").incidentRate(3.8).build(),
                DashboardSummaryResponse.HighIncidentCompany.builder()
                        .companyId(3L).companyName("글로벌마린서비스").incidentRate(3.1).build()
        );

        return DashboardSummaryResponse.builder()
                .pendingApprovalCount(pendingApprovalCount)
                .myPendingRegistrationStatus(myPendingStatus)
                .highIncidentCompanies(dummy)
                .pendingAccessRequests(0L)
                .pendingEvaluations(0L)
                .recentNotifications(recentBrief)
                .build();
    }
}
