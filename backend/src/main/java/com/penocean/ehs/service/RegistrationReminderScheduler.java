package com.penocean.ehs.service;

import com.penocean.ehs.mapper.CompanyMapper;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.Company;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * PPT slide 8 요구사항: 가입 승인 요청이 2일 안에 처리되지 않으면 관리자에게
 * 자동 리마인드 메일을 보낸다.
 *
 * 매일 09:00 (Asia/Seoul) 에 PENDING 이면서 가입 후 {@code threshold-hours} 이상
 * 경과한 신청건을 스캔해 관리자에게 리마인드를 발송한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RegistrationReminderScheduler {

    private final UserMapper userMapper;
    private final CompanyMapper companyMapper;
    private final NotificationService notificationService;

    @Value("${app.registration.reminder-threshold-hours:48}")
    private int thresholdHours;

    /** 매일 09:00 KST */
    @Scheduled(cron = "${app.registration.reminder-cron:0 0 9 * * *}", zone = "Asia/Seoul")
    public void sendReminders() {
        List<User> pending;
        try {
            pending = userMapper.findPendingOlderThanHours(thresholdHours);
        } catch (Exception e) {
            log.warn("[reg-reminder] query failed: {}", e.getMessage());
            return;
        }
        if (pending == null || pending.isEmpty()) {
            log.debug("[reg-reminder] no overdue pending registrations");
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (User u : pending) {
            String companyName = null;
            String businessNumber = null;
            if (u.getCompanyId() != null) {
                Company c = companyMapper.findById(u.getCompanyId());
                if (c != null) {
                    companyName = c.getName();
                    businessNumber = c.getBusinessNumber();
                }
            }
            if (companyName == null) companyName = u.getName() != null ? u.getName() : u.getUsername();
            if (businessNumber == null) businessNumber = "-";

            long elapsedHours = u.getCreatedAt() != null
                    ? Duration.between(u.getCreatedAt(), now).toHours()
                    : thresholdHours;

            notificationService.notifyRegistrationReminderToAdmins(
                    companyName, businessNumber, elapsedHours);
            log.info("[reg-reminder] sent for userId={} ({}h elapsed)", u.getId(), elapsedHours);
        }
    }
}
