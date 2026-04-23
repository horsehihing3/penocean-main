package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.AccessRequestCreateRequest;
import com.penocean.ehs.dto.request.AccessRequestUpdateRequest;
import com.penocean.ehs.dto.response.AccessRequestDetailResponse;
import com.penocean.ehs.dto.response.AccessRequestListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.AccessAttachmentMapper;
import com.penocean.ehs.mapper.AccessRequestMapper;
import com.penocean.ehs.mapper.AccessReviewLogMapper;
import com.penocean.ehs.mapper.AccessWorkerMapper;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.AccessAttachment;
import com.penocean.ehs.model.AccessRequest;
import com.penocean.ehs.model.AccessReviewLog;
import com.penocean.ehs.model.AccessWorker;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccessRequestService {

    private static final DateTimeFormatter YMD = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final AccessRequestMapper accessRequestMapper;
    private final AccessWorkerMapper accessWorkerMapper;
    private final AccessAttachmentMapper accessAttachmentMapper;
    private final AccessReviewLogMapper accessReviewLogMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;
    private final VisitPermitService visitPermitService;

    // ---------- list / detail ----------

    @Transactional(readOnly = true)
    public PageResponse<AccessRequestListItem> list(String status, Long companyId, Long vesselId,
                                                    String keyword, LocalDate dateFrom, LocalDate dateTo,
                                                    int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;

        // Role based company filter
        Long effectiveCompanyId = companyId;
        if (isContractor(caller)) {
            effectiveCompanyId = caller.getCompanyId();
            if (effectiveCompanyId == null) {
                return PageResponse.of(new ArrayList<>(), 0, p, s);
            }
        }

        List<AccessRequestListItem> content = accessRequestMapper.findPage(
                status, effectiveCompanyId, vesselId, keyword, dateFrom, dateTo, offset, s);
        long total = accessRequestMapper.count(status, effectiveCompanyId, vesselId, keyword, dateFrom, dateTo);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public AccessRequestDetailResponse detail(Long id, User caller) {
        AccessRequestDetailResponse detail = accessRequestMapper.findByIdWithDetails(id);
        if (detail == null) {
            throw new ResourceNotFoundException("AccessRequest", "id", id);
        }
        checkViewPermission(detail.getCompanyId(), caller);

        List<AccessWorker> workerEntities = accessWorkerMapper.findByRequest(id);
        detail.setWorkers(workerEntities.stream().map(this::toWorkerItem).toList());

        List<AccessAttachment> attachmentEntities = accessAttachmentMapper.findByRequest(id);
        detail.setAttachments(attachmentEntities.stream().map(this::toAttachmentItem).toList());

        detail.setReviewLogs(accessReviewLogMapper.findByRequest(id));
        return detail;
    }

    // ---------- create / update / submit / delete ----------

    @Transactional
    public Long create(AccessRequestCreateRequest request, User caller) {
        Long companyId = request.getCompanyId();
        if (isContractor(caller)) {
            companyId = caller.getCompanyId();
        }
        if (companyId == null) {
            throw new BadRequestException("companyId는 필수입니다.");
        }
        if (request.getVesselId() == null) {
            throw new BadRequestException("vesselId는 필수입니다.");
        }
        if (request.getPlannedStartDate() == null || request.getPlannedEndDate() == null) {
            throw new BadRequestException("plannedStartDate / plannedEndDate는 필수입니다.");
        }
        if (request.getPlannedEndDate().isBefore(request.getPlannedStartDate())) {
            throw new BadRequestException("plannedEndDate가 plannedStartDate보다 이전일 수 없습니다.");
        }

        String requestNo = generateRequestNo(LocalDate.now());
        int workerCount = request.getWorkers() == null ? 0 : request.getWorkers().size();

        AccessRequest entity = AccessRequest.builder()
                .requestNo(requestNo)
                .companyId(companyId)
                .vesselId(request.getVesselId())
                .portId(request.getPortId())
                .workType(request.getWorkType())
                .workDescription(request.getWorkDescription())
                .plannedStartDate(request.getPlannedStartDate())
                .plannedEndDate(request.getPlannedEndDate())
                .workerCount(workerCount)
                .status("DRAFT")
                .submittedBy(caller.getId())
                .build();
        accessRequestMapper.insert(entity);
        Long id = entity.getId();

        // workers
        if (request.getWorkers() != null && !request.getWorkers().isEmpty()) {
            List<AccessWorker> workers = new ArrayList<>();
            for (AccessRequestCreateRequest.WorkerItem w : request.getWorkers()) {
                workers.add(AccessWorker.builder()
                        .accessRequestId(id)
                        .workerName(w.getWorkerName())
                        .workerBirth(w.getWorkerBirth())
                        .workerPhone(w.getWorkerPhone())
                        .workerRole(w.getWorkerRole())
                        .safetyEduCompleted(false)
                        .build());
            }
            accessWorkerMapper.bulkInsert(workers);
        }

        // review log - DRAFT 생성
        insertLog(id, "DRAFT_CREATE", "신청서가 생성되었습니다.", caller.getId());

        log.info("AccessRequest created: id={}, requestNo={}, userId={}", id, requestNo, caller.getId());
        return id;
    }

    /**
     * 신청서 재사용 (Clone). PPT slide 14:
     *   "신청서 재사용시 교육이수일자 제외한 나머지는 그대로 입력"
     * 새 DRAFT 신청서로 복제. 워커 리스트도 복사하되 교육이수 상태는 초기화.
     * 첨부(위험성평가/서약서/작업계획서)는 작업별로 달라야 해서 복사하지 않는다.
     */
    @Transactional
    public Long clone(Long sourceId, User caller) {
        AccessRequest source = loadEntity(sourceId);
        checkViewPermission(source.getCompanyId(), caller);

        String requestNo = generateRequestNo(LocalDate.now());
        AccessRequest copy = AccessRequest.builder()
                .requestNo(requestNo)
                .companyId(source.getCompanyId())
                .vesselId(source.getVesselId())
                .portId(source.getPortId())
                .workType(source.getWorkType())
                .workDescription(source.getWorkDescription())
                .plannedStartDate(source.getPlannedStartDate())
                .plannedEndDate(source.getPlannedEndDate())
                .workerCount(source.getWorkerCount())
                .status("DRAFT")
                .submittedBy(caller.getId())
                .build();
        accessRequestMapper.insert(copy);
        Long newId = copy.getId();

        List<AccessWorker> sourceWorkers = accessWorkerMapper.findByRequest(sourceId);
        if (sourceWorkers != null && !sourceWorkers.isEmpty()) {
            List<AccessWorker> workers = new ArrayList<>();
            for (AccessWorker w : sourceWorkers) {
                workers.add(AccessWorker.builder()
                        .accessRequestId(newId)
                        .workerName(w.getWorkerName())
                        .workerBirth(w.getWorkerBirth())
                        .workerPhone(w.getWorkerPhone())
                        .workerRole(w.getWorkerRole())
                        .safetyEduCompleted(false) // 교육이수일자 초기화
                        .build());
            }
            accessWorkerMapper.bulkInsert(workers);
        }

        insertLog(newId, "DRAFT_CREATE",
                String.format("신청서를 %s에서 재사용하여 생성했습니다.", source.getRequestNo()),
                caller.getId());

        log.info("AccessRequest cloned: sourceId={}, newId={}, newNo={}", sourceId, newId, requestNo);
        return newId;
    }

    @Transactional
    public void update(Long id, AccessRequestUpdateRequest request, User caller) {
        AccessRequest entity = loadEntity(id);
        checkWritePermission(entity, caller);
        if (!"DRAFT".equals(entity.getStatus()) && !"IMPROVEMENT_REQUESTED".equals(entity.getStatus())) {
            throw new BadRequestException("DRAFT 또는 IMPROVEMENT_REQUESTED 상태에서만 수정 가능합니다.");
        }

        entity.setVesselId(request.getVesselId() != null ? request.getVesselId() : entity.getVesselId());
        entity.setPortId(request.getPortId());
        entity.setWorkType(request.getWorkType() != null ? request.getWorkType() : entity.getWorkType());
        entity.setWorkDescription(request.getWorkDescription());
        if (request.getPlannedStartDate() != null) entity.setPlannedStartDate(request.getPlannedStartDate());
        if (request.getPlannedEndDate() != null) entity.setPlannedEndDate(request.getPlannedEndDate());
        if (entity.getPlannedEndDate().isBefore(entity.getPlannedStartDate())) {
            throw new BadRequestException("plannedEndDate가 plannedStartDate보다 이전일 수 없습니다.");
        }
        accessRequestMapper.updateCore(entity);

        if (request.getWorkers() != null) {
            accessWorkerMapper.deleteByRequest(id);
            if (!request.getWorkers().isEmpty()) {
                List<AccessWorker> workers = new ArrayList<>();
                for (AccessRequestCreateRequest.WorkerItem w : request.getWorkers()) {
                    workers.add(AccessWorker.builder()
                            .accessRequestId(id)
                            .workerName(w.getWorkerName())
                            .workerBirth(w.getWorkerBirth())
                            .workerPhone(w.getWorkerPhone())
                            .workerRole(w.getWorkerRole())
                            .safetyEduCompleted(false)
                            .build());
                }
                accessWorkerMapper.bulkInsert(workers);
            }
            accessRequestMapper.updateWorkerCount(id, request.getWorkers().size());
        }
        log.info("AccessRequest updated: id={}, userId={}", id, caller.getId());
    }

    @Transactional
    public void submit(Long id, User caller) {
        AccessRequest entity = loadEntity(id);
        checkWritePermission(entity, caller);
        if (!"DRAFT".equals(entity.getStatus()) && !"IMPROVEMENT_REQUESTED".equals(entity.getStatus())) {
            throw new BadRequestException("DRAFT 또는 IMPROVEMENT_REQUESTED 상태에서만 제출할 수 있습니다.");
        }
        accessRequestMapper.updateSubmit(id, caller.getId());
        insertLog(id, "SUBMIT", "신청서가 제출되었습니다.", caller.getId());
        notificationService.notifyAdmins(
                "[팬오션] 신규 출입신청 제출",
                String.format("출입신청 %s 가 제출되었습니다. 검토가 필요합니다.", entity.getRequestNo()));
        log.info("AccessRequest submitted: id={}, userId={}", id, caller.getId());
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        AccessRequest entity = loadEntity(id);
        checkWritePermission(entity, caller);
        if (!"DRAFT".equals(entity.getStatus())) {
            throw new BadRequestException("DRAFT 상태에서만 삭제 가능합니다.");
        }
        accessRequestMapper.softDelete(id);
        log.info("AccessRequest deleted: id={}, userId={}", id, caller.getId());
    }

    // ---------- review ----------

    @Transactional
    public void review(Long id, String action, String comment, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("검토 권한이 없습니다.");
        }
        AccessRequest entity = loadEntity(id);

        switch (action == null ? "" : action.toUpperCase()) {
            case "START" -> {
                if (!"SUBMITTED".equals(entity.getStatus())) {
                    throw new BadRequestException("SUBMITTED 상태에서만 검토 시작이 가능합니다.");
                }
                accessRequestMapper.updateReviewer(id, "IN_REVIEW", caller.getId());
                insertLog(id, "REVIEW_START", comment, caller.getId());
            }
            case "IMPROVEMENT" -> {
                if (!"IN_REVIEW".equals(entity.getStatus()) && !"SUBMITTED".equals(entity.getStatus())) {
                    throw new BadRequestException("IN_REVIEW/SUBMITTED 상태에서만 개선요청이 가능합니다.");
                }
                if (comment == null || comment.isBlank()) {
                    throw new BadRequestException("개선요청 사유(comment)가 필요합니다.");
                }
                accessRequestMapper.updateImprovementReason(id, comment, caller.getId());
                insertLog(id, "IMPROVEMENT_REQUEST", comment, caller.getId());
                if (entity.getSubmittedBy() != null) {
                    notificationService.notifyUser(entity.getSubmittedBy(), "EMAIL",
                            "[팬오션] 출입신청 개선요청",
                            String.format("신청 %s 에 대해 개선요청이 있습니다.\n사유: %s",
                                    entity.getRequestNo(), comment));
                }
            }
            case "APPROVE" -> {
                if (!"IN_REVIEW".equals(entity.getStatus()) && !"SUBMITTED".equals(entity.getStatus())) {
                    throw new BadRequestException("IN_REVIEW/SUBMITTED 상태에서만 승인할 수 있습니다.");
                }
                accessRequestMapper.updateReviewer(id, "APPROVED", caller.getId());
                insertLog(id, "APPROVE", comment, caller.getId());

                visitPermitService.issueFor(
                        id,
                        entity.getVesselId(),
                        entity.getCompanyId(),
                        entity.getPlannedStartDate(),
                        entity.getPlannedEndDate(),
                        caller.getId());

                if (entity.getSubmittedBy() != null) {
                    notificationService.notifyUser(entity.getSubmittedBy(), "EMAIL",
                            "[팬오션] 출입신청 승인 · Visit Permit 발급",
                            String.format("신청 %s 가 승인되어 Visit Permit이 발급되었습니다.", entity.getRequestNo()));
                }
            }
            case "REJECT" -> {
                if ("APPROVED".equals(entity.getStatus()) || "REJECTED".equals(entity.getStatus())) {
                    throw new BadRequestException("이미 종료된 신청은 반려할 수 없습니다.");
                }
                accessRequestMapper.updateReviewer(id, "REJECTED", caller.getId());
                insertLog(id, "REJECT", comment, caller.getId());
                if (entity.getSubmittedBy() != null) {
                    notificationService.notifyUser(entity.getSubmittedBy(), "EMAIL",
                            "[팬오션] 출입신청 반려",
                            String.format("신청 %s 가 반려되었습니다.%s",
                                    entity.getRequestNo(),
                                    comment != null ? ("\n사유: " + comment) : ""));
                }
            }
            default -> throw new BadRequestException("알 수 없는 action: " + action);
        }
        log.info("AccessRequest reviewed: id={}, action={}, userId={}", id, action, caller.getId());
    }

    // ---------- workers ----------

    @Transactional
    public void addWorkers(Long id, List<AccessRequestCreateRequest.WorkerItem> workers, User caller) {
        AccessRequest entity = loadEntity(id);
        checkWritePermission(entity, caller);
        if (workers == null || workers.isEmpty()) return;
        List<AccessWorker> entities = new ArrayList<>();
        for (AccessRequestCreateRequest.WorkerItem w : workers) {
            entities.add(AccessWorker.builder()
                    .accessRequestId(id)
                    .workerName(w.getWorkerName())
                    .workerBirth(w.getWorkerBirth())
                    .workerPhone(w.getWorkerPhone())
                    .workerRole(w.getWorkerRole())
                    .safetyEduCompleted(false)
                    .build());
        }
        accessWorkerMapper.bulkInsert(entities);
        int count = accessWorkerMapper.countByRequest(id);
        accessRequestMapper.updateWorkerCount(id, count);
    }

    @Transactional
    public void removeWorker(Long requestId, Long workerId, User caller) {
        AccessRequest entity = loadEntity(requestId);
        checkWritePermission(entity, caller);
        accessWorkerMapper.softDelete(workerId);
        int count = accessWorkerMapper.countByRequest(requestId);
        accessRequestMapper.updateWorkerCount(requestId, count);
    }

    @Transactional
    public void updateEduStatus(Long workerId, boolean completed, String certUrl, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("안전교육 이수 상태 변경은 관리자/계약부서만 가능합니다.");
        }
        accessWorkerMapper.updateEduStatus(workerId, completed, certUrl);
    }

    /**
     * 방문허가서(Visit Permit) 작업자별 "Check by ship" 토글. PPT slide 15.
     * 기본적으로 관리자/계약부서가 선박 측 승선 확인을 기록하는 용도.
     */
    @Transactional
    public void updateCheckByShip(Long workerId, boolean checked, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("선박 승선 체크는 관리자/계약부서만 가능합니다.");
        }
        accessWorkerMapper.updateCheckByShip(workerId, checked, caller.getId());
    }

    // ---------- attachments ----------

    @Transactional
    public Long addAttachment(Long requestId, String attachmentType,
                              String fileName, String filePath,
                              Long fileSize, String mimeType, User caller) {
        AccessRequest entity = loadEntity(requestId);
        checkWritePermission(entity, caller);
        AccessAttachment att = AccessAttachment.builder()
                .accessRequestId(requestId)
                .attachmentType(attachmentType)
                .fileName(fileName)
                .filePath(filePath)
                .fileSize(fileSize)
                .mimeType(mimeType)
                .uploadedBy(caller.getId())
                .build();
        accessAttachmentMapper.insert(att);
        return att.getId();
    }

    @Transactional
    public void removeAttachment(Long requestId, Long attachmentId, User caller) {
        AccessRequest entity = loadEntity(requestId);
        checkWritePermission(entity, caller);
        accessAttachmentMapper.softDelete(attachmentId);
    }

    // ---------- helpers ----------

    private AccessRequest loadEntity(Long id) {
        AccessRequest entity = accessRequestMapper.findById(id);
        if (entity == null) {
            throw new ResourceNotFoundException("AccessRequest", "id", id);
        }
        return entity;
    }

    private void checkViewPermission(Long companyId, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller) && companyId != null && companyId.equals(caller.getCompanyId())) return;
        throw new UnauthorizedException("해당 신청서를 조회할 권한이 없습니다.");
    }

    private void checkWritePermission(AccessRequest entity, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller) && entity.getCompanyId() != null
                && entity.getCompanyId().equals(caller.getCompanyId())) return;
        throw new UnauthorizedException("해당 신청서를 수정할 권한이 없습니다.");
    }

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String role = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(role) || "CONTRACT_DEPT".equals(role);
    }

    private void insertLog(Long requestId, String action, String comment, Long actorId) {
        accessReviewLogMapper.insert(AccessReviewLog.builder()
                .accessRequestId(requestId)
                .action(action)
                .comment(comment)
                .actorUserId(actorId)
                .build());
    }

    private String generateRequestNo(LocalDate date) {
        String ymd = date.format(YMD);
        Integer max = accessRequestMapper.findMaxRequestNoSeq(ymd);
        int next = (max == null ? 0 : max) + 1;
        return String.format("AR-%s-%04d", ymd, next);
    }

    private AccessRequestDetailResponse.WorkerItem toWorkerItem(AccessWorker w) {
        return AccessRequestDetailResponse.WorkerItem.builder()
                .id(w.getId())
                .workerName(w.getWorkerName())
                .workerBirth(w.getWorkerBirth())
                .workerPhone(w.getWorkerPhone())
                .workerRole(w.getWorkerRole())
                .safetyEduCompleted(w.getSafetyEduCompleted())
                .safetyEduCompletedAt(w.getSafetyEduCompletedAt())
                .safetyEduCertificateUrl(w.getSafetyEduCertificateUrl())
                .checkByShip(w.getCheckByShip())
                .checkByShipAt(w.getCheckByShipAt())
                .build();
    }

    private AccessRequestDetailResponse.AttachmentItem toAttachmentItem(AccessAttachment a) {
        return AccessRequestDetailResponse.AttachmentItem.builder()
                .id(a.getId())
                .attachmentType(a.getAttachmentType())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .fileSize(a.getFileSize())
                .mimeType(a.getMimeType())
                .uploadedBy(a.getUploadedBy())
                .uploadedAt(a.getUploadedAt())
                .build();
    }
}
