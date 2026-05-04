package com.penocean.ehs.service;

import com.penocean.ehs.mapper.NotificationMapper;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.Notification;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationMapper notificationMapper;
    private final UserMapper userMapper;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.portal-url:http://localhost:4000}")
    private String portalUrl;

    @Value("${app.safety-team-phone:02-316-0000}")
    private String safetyTeamPhone;

    @Value("${app.team-emails:}")
    private String teamEmailsRaw;

    @Value("${app.mail-from:}")
    private String mailFrom;

    private void sendEmail(String[] to, String subject, String body) {
        if (to == null || to.length == 0) return;
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.info("JavaMailSender not available; skipping SMTP for '{}'", subject);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            if (mailFrom != null && !mailFrom.isBlank()) msg.setFrom(mailFrom);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            sender.send(msg);
        } catch (Exception e) {
            // 운영 실패가 흐름을 막지 않도록 warn 만 찍고 지나감
            log.warn("Failed to send email [{}] to {}: {}", subject, Arrays.toString(to), e.getMessage());
        }
    }

    /** PPT 요구: 등록완료 시 팀메일 발송. app.team-emails 에 쉼표 구분으로 설정. */
    // [2026-04-30] notifyTeam을 public으로 유지하고 notifyRegistrationRequestToAdmins에서 호출
    public void notifyTeam(String subject, String body) {
        if (teamEmailsRaw == null || teamEmailsRaw.isBlank()) {
            log.info("app.team-emails not configured; skipping team email '{}'", subject);
            return;
        }
        String[] to = Arrays.stream(teamEmailsRaw.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toArray(String[]::new);
        sendEmail(to, subject, body);
    }

    private String portalLinkLine() {
        return "\n[포털 바로가기] " + portalUrl;
    }

    private String footerLine() {
        return "\n\n※ 문의사항이 있으시면 팬오션 안전경영팀(" + safetyTeamPhone + ")으로 연락주시기 바랍니다.";
    }

    /** 협력업체 가입신청 → 관리자에게 승인요청 알림 (PPT slide 8) */
    public void notifyRegistrationRequestToAdmins(String companyName, String businessNumber) {
        String subject = "[승인요청] 안전보건포털 가입 승인 요청";
        String body = String.format(
                "%s(%s) 님의 안전보건포털 가입신청이 접수되었습니다.\n"
                        + "포털 로그인 후 가입신청서 검토 및 승인바랍니다.%s",
                companyName, businessNumber, portalLinkLine());
        // [2026-04-30] SYSTEM 알림(DB) + 팀메일 이메일 발송 병행
        notifyAdmins(subject, body);
        notifyTeam(subject, body);
    }

    /** PPT slide 8 - 2-day reminder: 미승인 상태가 지속되는 가입신청을 관리자에게 재알림 */
    public void notifyRegistrationReminderToAdmins(String companyName, String businessNumber,
                                                   long elapsedHours) {
        long days = elapsedHours / 24;
        String subject = "[REMIND] 미승인 가입신청이 " + days + "일 경과했습니다";
        String body = String.format(
                "%s(%s) 님의 가입신청이 접수된 지 약 %d시간(%d일)이 지났으나 아직 승인되지 않았습니다.\n"
                        + "포털에서 검토 후 승인 또는 반려 처리 바랍니다.%s",
                companyName, businessNumber, elapsedHours, days, portalLinkLine());
        notifyAdmins(subject, body);
    }

    /** 가입 승인 완료 → 협력업체 알림 (PPT slide 9) */
    public void notifyRegistrationApproved(Long userId) {
        String subject = "[PANocean] 안전보건포털 가입 신청 승인 완료";
        String body = "PANocean 안전보건포털 가입신청이 승인되었습니다."
                + portalLinkLine()
                + footerLine();
        notifyUser(userId, "EMAIL", subject, body);
    }

    /** 가입 반려 → 협력업체 알림. reason + 재가입 링크 포함 (PPT slide 9) */
    public void notifyRegistrationRejected(Long userId, String reason, String reapplyToken) {
        String subject = "[PANocean] 안전보건포털 가입 신청 반려";
        StringBuilder body = new StringBuilder();
        body.append("PANocean 안전보건포털 가입신청이 반려되었습니다.");
        if (reason != null && !reason.isBlank()) {
            body.append("\n\n반려사유: ").append(reason);
        }
        body.append("\n\n아래 링크를 클릭하시면 기존 입력 내용을 불러와 재신청하실 수 있습니다.");
        body.append("\n[재가입 신청] ").append(portalUrl).append("/?reapply=").append(reapplyToken);
        body.append(footerLine());
        notifyUser(userId, "EMAIL", subject, body.toString());
    }

    /** ADMIN 전원에게 SYSTEM 채널 알림을 기록한다. */
    @Transactional
    public void notifyAdmins(String subject, String body) {
        List<User> admins = userMapper.findByRole("ADMIN");
        for (User admin : admins) {
            notifyUser(admin.getId(), "SYSTEM", subject, body);
        }
    }

    /**
     * 단일 유저 알림. EMAIL 채널이면 DB 기록 + 실제 SMTP 발송을 함께 수행.
     * SMTP 실패는 warn 로그만 남기고 호출자 흐름에 영향 주지 않는다.
     */
    @Transactional
    public void notifyUser(Long userId, String channel, String subject, String body) {
        if (userId == null) return;
        Notification n = Notification.builder()
                .recipientUserId(userId)
                .channel(channel)
                .subject(subject)
                .body(body)
                .status("PENDING")
                .build();
        notificationMapper.insert(n);
        log.info("Notification created: userId={}, channel={}, subject={}", userId, channel, subject);

        if ("EMAIL".equalsIgnoreCase(channel)) {
            User u = userMapper.findById(userId);
            if (u != null && u.getEmail() != null && !u.getEmail().isBlank()) {
                sendEmail(new String[] { u.getEmail() }, subject, body);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Notification> findRecentByUser(Long userId, int limit) {
        return notificationMapper.findByUser(userId, 0, limit);
    }

    @Transactional(readOnly = true)
    public long countUnreadByUser(Long userId) {
        return notificationMapper.countUnreadByUser(userId);
    }
}
