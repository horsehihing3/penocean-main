package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.WorkerVoiceCreateRequest;
import com.penocean.ehs.dto.request.WorkerVoiceUpdateStatusRequest;
import com.penocean.ehs.dto.response.WorkerVoiceDetailResponse;
import com.penocean.ehs.dto.response.WorkerVoiceListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.mapper.VoiceAttachmentMapper;
import com.penocean.ehs.mapper.WorkerVoiceMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.model.VoiceAttachment;
import com.penocean.ehs.model.WorkerVoice;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkerVoiceService {

    private static final Set<String> VOICE_TYPES = Set.of("NEAR_MISS", "INCIDENT", "INQUIRY");
    private static final Set<String> SEVERITIES = Set.of("LOW", "MEDIUM", "HIGH", "CRITICAL");
    private static final Set<String> STATUSES = Set.of("SUBMITTED", "TRIAGED", "IN_PROGRESS", "RESOLVED", "CLOSED");

    private final WorkerVoiceMapper workerVoiceMapper;
    private final VoiceAttachmentMapper voiceAttachmentMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public PageResponse<WorkerVoiceListItem> list(String voiceType, String status,
                                                  Long companyId, Long vesselId,
                                                  String keyword, LocalDate dateFrom, LocalDate dateTo,
                                                  int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;

        Long effectiveCompanyId = companyId;
        Boolean excludeAnonymous = null;
        if (isContractor(caller)) {
            effectiveCompanyId = caller.getCompanyId();
            if (effectiveCompanyId == null) {
                return PageResponse.of(new ArrayList<>(), 0, p, s);
            }
            // CONTRACTOR는 익명 제보는 조회 불가 (자기가 속한 업체 소속 익명 보호)
            excludeAnonymous = Boolean.TRUE;
        }

        List<WorkerVoiceListItem> content = workerVoiceMapper.findPage(
                voiceType, status, effectiveCompanyId, vesselId, keyword,
                dateFrom, dateTo, excludeAnonymous, offset, s);
        long total = workerVoiceMapper.count(
                voiceType, status, effectiveCompanyId, vesselId, keyword,
                dateFrom, dateTo, excludeAnonymous);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public WorkerVoiceDetailResponse detail(Long id, User caller) {
        WorkerVoiceDetailResponse detail = workerVoiceMapper.findByIdWithDetail(id);
        if (detail == null) {
            throw new ResourceNotFoundException("WorkerVoice", "id", id);
        }
        checkViewPermission(detail.getCompanyId(), detail.getReporterAnonymous(), caller);

        detail.setAttachments(voiceAttachmentMapper.findByVoice(id).stream()
                .map(this::toAttachmentItem).collect(Collectors.toList()));
        return detail;
    }

    @Transactional
    public Long create(WorkerVoiceCreateRequest request, User caller) {
        validateCreate(request);

        boolean anonymous = Boolean.TRUE.equals(request.getAnonymous());

        // CONTRACTOR 본인 company 매칭
        Long companyId = request.getCompanyId();
        if (isContractor(caller) && companyId == null) {
            companyId = caller.getCompanyId();
        }

        // 팀메일 수신자 기록 (ADMIN 이메일)
        String emailSentTo = buildAdminEmailList();

        WorkerVoice entity = WorkerVoice.builder()
                .voiceNo(generateVoiceNo())
                .voiceType(request.getVoiceType().toUpperCase())
                .title(request.getTitle())
                .content(request.getContent())
                .companyId(companyId)
                .vesselId(request.getVesselId())
                .reporterUserId(anonymous ? null : caller.getId())
                .reporterAnonymous(anonymous)
                .severity(request.getSeverity() == null ? null : request.getSeverity().toUpperCase())
                .status("SUBMITTED")
                .emailSentTo(emailSentTo)
                .build();

        try {
            workerVoiceMapper.insert(entity);
        } catch (DuplicateKeyException dup) {
            entity.setVoiceNo(generateVoiceNo());
            workerVoiceMapper.insert(entity);
        }

        String wvSubject = "[팬오션] 근로자 의견 접수";
        String wvBody = String.format("근로자 의견 %s (%s) 이 접수되었습니다.",
                entity.getVoiceNo(), entity.getVoiceType());
        notificationService.notifyAdmins(wvSubject, wvBody);
        // PPT slide 17: 등록완료 시 팀메일 발송
        notificationService.notifyTeam(wvSubject, wvBody);

        log.info("WorkerVoice created: id={}, no={}, anonymous={}, reporter={}",
                entity.getId(), entity.getVoiceNo(), anonymous, anonymous ? null : caller.getId());
        return entity.getId();
    }

    @Transactional
    public void updateStatus(Long id, WorkerVoiceUpdateStatusRequest request, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("상태 변경 권한이 없습니다.");
        }
        loadEntity(id);
        if (request == null || request.getStatus() == null
                || !STATUSES.contains(request.getStatus().toUpperCase())) {
            throw new BadRequestException("유효한 status 값이 필요합니다.");
        }
        workerVoiceMapper.updateStatus(id, request.getStatus().toUpperCase(),
                request.getAssignedTo(), request.getResolution());
        log.info("WorkerVoice status updated: id={}, status={}, by={}", id, request.getStatus(), caller.getId());
    }

    @Transactional
    public Long addAttachment(Long voiceId, String fileName, String filePath,
                              Long fileSize, String mimeType, User caller) {
        WorkerVoice entity = loadEntity(voiceId);
        checkWritePermission(entity, caller);
        VoiceAttachment att = VoiceAttachment.builder()
                .voiceId(voiceId)
                .fileName(fileName)
                .filePath(filePath)
                .fileSize(fileSize)
                .mimeType(mimeType)
                .uploadedBy(caller.getId())
                .build();
        voiceAttachmentMapper.insert(att);
        return att.getId();
    }

    @Transactional
    public void removeAttachment(Long voiceId, Long attachmentId, User caller) {
        WorkerVoice entity = loadEntity(voiceId);
        checkWritePermission(entity, caller);
        voiceAttachmentMapper.softDelete(attachmentId);
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("삭제 권한이 없습니다.");
        }
        loadEntity(id);
        workerVoiceMapper.softDelete(id);
        log.info("WorkerVoice soft-deleted: id={}, by={}", id, caller.getId());
    }

    // ---------- helpers ----------

    private WorkerVoice loadEntity(Long id) {
        WorkerVoice v = workerVoiceMapper.findById(id);
        if (v == null) throw new ResourceNotFoundException("WorkerVoice", "id", id);
        return v;
    }

    private void validateCreate(WorkerVoiceCreateRequest request) {
        if (request == null) throw new BadRequestException("요청 바디가 비어있습니다.");
        if (request.getVoiceType() == null || !VOICE_TYPES.contains(request.getVoiceType().toUpperCase())) {
            throw new BadRequestException("voiceType은 NEAR_MISS/INCIDENT/INQUIRY 이어야 합니다.");
        }
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("title은 필수입니다.");
        }
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("content는 필수입니다.");
        }
        if (request.getSeverity() != null && !request.getSeverity().isBlank()
                && !SEVERITIES.contains(request.getSeverity().toUpperCase())) {
            throw new BadRequestException("severity는 LOW/MEDIUM/HIGH/CRITICAL 이어야 합니다.");
        }
    }

    private String generateVoiceNo() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Integer max = workerVoiceMapper.findMaxSeqByDate(date);
        int next = (max == null ? 0 : max) + 1;
        return String.format("WV-%s-%04d", date, next);
    }

    private String buildAdminEmailList() {
        List<User> admins = userMapper.findByRole("ADMIN");
        return admins.stream()
                .map(User::getEmail)
                .filter(e -> e != null && !e.isBlank())
                .collect(Collectors.joining(","));
    }

    private WorkerVoiceDetailResponse.AttachmentItem toAttachmentItem(VoiceAttachment a) {
        return WorkerVoiceDetailResponse.AttachmentItem.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .fileSize(a.getFileSize())
                .mimeType(a.getMimeType())
                .uploadedBy(a.getUploadedBy())
                .uploadedAt(a.getUploadedAt())
                .build();
    }

    private void checkViewPermission(Long companyId, Boolean anonymous, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller)) {
            if (Boolean.TRUE.equals(anonymous)) {
                throw new UnauthorizedException("익명 제보는 관리자만 조회할 수 있습니다.");
            }
            if (companyId != null && companyId.equals(caller.getCompanyId())) return;
        }
        throw new UnauthorizedException("해당 의견을 조회할 권한이 없습니다.");
    }

    private void checkWritePermission(WorkerVoice entity, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller) && entity.getCompanyId() != null
                && entity.getCompanyId().equals(caller.getCompanyId())) return;
        throw new UnauthorizedException("권한이 없습니다.");
    }

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String role = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(role) || "CONTRACT_DEPT".equals(role);
    }
}
