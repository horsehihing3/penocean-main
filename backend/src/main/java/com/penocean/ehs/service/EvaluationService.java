package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.EvaluationCreateRequest;
import com.penocean.ehs.dto.request.EvaluationUpdateRequest;
import com.penocean.ehs.dto.response.EvaluationDetailResponse;
import com.penocean.ehs.dto.response.EvaluationListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.EvaluationAttachmentMapper;
import com.penocean.ehs.mapper.EvaluationHistoryMapper;
import com.penocean.ehs.mapper.EvaluationItemMapper;
import com.penocean.ehs.mapper.EvaluationItemScoreMapper;
import com.penocean.ehs.mapper.EvaluationMapper;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.Evaluation;
import com.penocean.ehs.model.EvaluationAttachment;
import com.penocean.ehs.model.EvaluationHistory;
import com.penocean.ehs.model.EvaluationItem;
import com.penocean.ehs.model.EvaluationItemScore;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationService {

    private static final BigDecimal DEFAULT_THRESHOLD = new BigDecimal("60.00");

    private final EvaluationMapper evaluationMapper;
    private final EvaluationItemMapper evaluationItemMapper;
    private final EvaluationItemScoreMapper evaluationItemScoreMapper;
    private final EvaluationAttachmentMapper evaluationAttachmentMapper;
    private final EvaluationHistoryMapper evaluationHistoryMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    private void log(Long evalId, String action, User actor, String detail) {
        evaluationHistoryMapper.insert(EvaluationHistory.builder()
                .evaluationId(evalId)
                .action(action)
                .actorUserId(actor == null ? null : actor.getId())
                .actorName(actor == null ? null : actor.getName())
                .detail(detail)
                .build());
    }

    // ---------- list / detail ----------

    @Transactional(readOnly = true)
    public PageResponse<EvaluationListItem> list(String status, Long companyId,
                                                 Integer periodYear, String periodHalf,
                                                 String evaluationType, String keyword,
                                                 int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;

        Long effectiveCompanyId = companyId;
        if (isContractor(caller)) {
            effectiveCompanyId = caller.getCompanyId();
            if (effectiveCompanyId == null) {
                return PageResponse.of(new ArrayList<>(), 0, p, s);
            }
        }

        List<EvaluationListItem> content = evaluationMapper.findPage(
                status, effectiveCompanyId, periodYear, periodHalf, evaluationType, keyword, offset, s);
        long total = evaluationMapper.count(
                status, effectiveCompanyId, periodYear, periodHalf, evaluationType, keyword);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public EvaluationDetailResponse detail(Long id, User caller) {
        EvaluationDetailResponse detail = evaluationMapper.findByIdWithDetail(id);
        if (detail == null) {
            throw new ResourceNotFoundException("Evaluation", "id", id);
        }
        checkViewPermission(detail.getCompanyId(), caller);

        detail.setItemScores(evaluationItemScoreMapper.findByEvaluationWithItem(id));
        detail.setAttachments(evaluationAttachmentMapper.findByEvaluation(id).stream()
                .map(this::toAttachmentItem).toList());
        return detail;
    }

    // ---------- create / update ----------

    @Transactional
    public Long create(EvaluationCreateRequest request, User caller) {
        validateCreate(request);
        if (isContractor(caller)) {
            // CONTRACTOR의 self-evaluation: 자기 companyId 만 허용
            if (caller.getCompanyId() == null) {
                throw new BadRequestException("CONTRACTOR 계정에 companyId가 없습니다.");
            }
            request.setCompanyId(caller.getCompanyId());
        }
        if (request.getCompanyId() == null) {
            throw new BadRequestException("companyId는 필수입니다.");
        }

        // 중복 체크 (UNIQUE 제약과 함께)
        int exists = evaluationMapper.countByCompanyAndPeriod(
                request.getCompanyId(), request.getPeriodYear(),
                request.getPeriodHalf(), normalizeType(request.getEvaluationType()));
        if (exists > 0) {
            throw new BadRequestException("해당 업체의 같은 기간/유형 평가가 이미 존재합니다.");
        }

        // 항목 로딩 (요청 itemId 기준). 미지정 시 active 전체
        List<EvaluationItem> items = loadItemsForRequest(request.getItemScores());

        BigDecimal threshold = request.getQualificationThreshold() != null
                ? request.getQualificationThreshold() : DEFAULT_THRESHOLD;

        ScoreCalc calc = calculateScores(items, request.getItemScores());

        Evaluation entity = Evaluation.builder()
                .evaluationNo(generateEvaluationNo(request.getPeriodYear(), request.getPeriodHalf()))
                .companyId(request.getCompanyId())
                .periodYear(request.getPeriodYear())
                .periodHalf(request.getPeriodHalf())
                .evaluationType(normalizeType(request.getEvaluationType()))
                .evaluatorUserId(caller.getId())
                .status("DRAFT")
                .totalScore(calc.totalScore)
                .maxTotalScore(calc.maxTotalScore)
                .scorePercentage(calc.scorePercentage)
                .qualified(calc.qualified(threshold))
                .qualificationThreshold(threshold)
                .comment(request.getComment())
                .build();

        try {
            evaluationMapper.insert(entity);
        } catch (DuplicateKeyException dup) {
            // evaluation_no 충돌 시 한 번 재시도
            entity.setEvaluationNo(generateEvaluationNo(request.getPeriodYear(), request.getPeriodHalf()));
            evaluationMapper.insert(entity);
        }
        Long id = entity.getId();

        // item_scores bulk insert
        if (!calc.scoreRows.isEmpty()) {
            for (EvaluationItemScore row : calc.scoreRows) row.setEvaluationId(id);
            evaluationItemScoreMapper.bulkInsert(calc.scoreRows);
        }

        log(id, "CREATE", caller,
                String.format("평가 %s 가 생성되었습니다.", entity.getEvaluationNo()));
        log.info("Evaluation created: id={}, no={}, userId={}", id, entity.getEvaluationNo(), caller.getId());
        return id;
    }

    @Transactional
    public void update(Long id, EvaluationUpdateRequest request, User caller) {
        Evaluation entity = loadEntity(id);
        checkWritePermission(entity, caller);
        if (!"DRAFT".equals(entity.getStatus()) && !"REJECTED".equals(entity.getStatus())) {
            throw new BadRequestException("DRAFT/REJECTED 상태에서만 수정 가능합니다.");
        }

        BigDecimal threshold = request.getQualificationThreshold() != null
                ? request.getQualificationThreshold() : entity.getQualificationThreshold();

        List<EvaluationItem> items = loadItemsForRequest(request.getItemScores());
        ScoreCalc calc = calculateScores(items, request.getItemScores());

        evaluationItemScoreMapper.deleteByEvaluation(id);
        if (!calc.scoreRows.isEmpty()) {
            for (EvaluationItemScore row : calc.scoreRows) row.setEvaluationId(id);
            evaluationItemScoreMapper.bulkInsert(calc.scoreRows);
        }
        evaluationMapper.updateScores(id,
                calc.totalScore, calc.maxTotalScore, calc.scorePercentage,
                calc.qualified(threshold),
                request.getComment() != null ? request.getComment() : entity.getComment(),
                threshold);
        log(id, "UPDATE", caller,
                String.format("점수 수정됨 (총점 %s/%s).", calc.totalScore, calc.maxTotalScore));
        log.info("Evaluation updated: id={}, userId={}", id, caller.getId());
    }

    @Transactional
    public void submit(Long id, User caller) {
        Evaluation entity = loadEntity(id);
        checkWritePermission(entity, caller);
        if (!"DRAFT".equals(entity.getStatus()) && !"REJECTED".equals(entity.getStatus())) {
            throw new BadRequestException("DRAFT/REJECTED 상태에서만 제출 가능합니다.");
        }
        evaluationMapper.submit(id);
        String evSubject = "[팬오션] 협력업체 평가 제출";
        String evBody = String.format("평가 %s 가 제출되었습니다. 검토가 필요합니다.", entity.getEvaluationNo());
        notificationService.notifyAdmins(evSubject, evBody);
        // PPT slide 20: 계약부서가 등록완료 시 팀메일 발송
        notificationService.notifyTeam(evSubject, evBody);
        log(id, "SUBMIT", caller,
                String.format("평가 %s 가 제출되었습니다.", entity.getEvaluationNo()));
        log.info("Evaluation submitted: id={}, userId={}", id, caller.getId());
    }

    @Transactional
    public void review(Long id, String action, String reason, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("검토 권한이 없습니다.");
        }
        Evaluation entity = loadEntity(id);
        if (!"SUBMITTED".equals(entity.getStatus())) {
            throw new BadRequestException("SUBMITTED 상태에서만 검토할 수 있습니다.");
        }
        switch (action == null ? "" : action.toUpperCase()) {
            case "APPROVE" -> {
                evaluationMapper.approve(id, caller.getId());
                notifyCompanyContractors(entity.getCompanyId(),
                        "[팬오션] 협력업체 평가 승인",
                        String.format("평가 %s 가 승인되었습니다.", entity.getEvaluationNo()));
                log(id, "APPROVE", caller,
                        String.format("평가 %s 가 승인되었습니다.", entity.getEvaluationNo()));
            }
            case "REJECT" -> {
                if (reason == null || reason.isBlank()) {
                    throw new BadRequestException("반려 사유(reason)가 필요합니다.");
                }
                evaluationMapper.reject(id, caller.getId(), reason);
                notifyCompanyContractors(entity.getCompanyId(),
                        "[팬오션] 협력업체 평가 반려",
                        String.format("평가 %s 가 반려되었습니다.%n사유: %s", entity.getEvaluationNo(), reason));
                log(id, "REJECT", caller,
                        String.format("반려 사유: %s", reason));
            }
            default -> throw new BadRequestException("알 수 없는 action: " + action);
        }
        log.info("Evaluation reviewed: id={}, action={}, userId={}", id, action, caller.getId());
    }

    @Transactional(readOnly = true)
    public List<EvaluationHistory> findHistory(Long id) {
        loadEntity(id); // 존재 확인
        return evaluationHistoryMapper.findByEvaluation(id);
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        Evaluation entity = loadEntity(id);
        checkWritePermission(entity, caller);
        if (!"DRAFT".equals(entity.getStatus())) {
            throw new BadRequestException("DRAFT 상태에서만 삭제 가능합니다.");
        }
        evaluationMapper.softDelete(id);
        log.info("Evaluation soft-deleted: id={}", id);
    }

    // ---------- attachments ----------

    @Transactional
    public Long addAttachment(Long evaluationId, Long itemId, String fileName, String filePath,
                              Long fileSize, String mimeType, User caller) {
        Evaluation entity = loadEntity(evaluationId);
        checkWritePermission(entity, caller);
        EvaluationAttachment att = EvaluationAttachment.builder()
                .evaluationId(evaluationId)
                .itemId(itemId)
                .fileName(fileName)
                .filePath(filePath)
                .fileSize(fileSize)
                .mimeType(mimeType)
                .uploadedBy(caller.getId())
                .build();
        evaluationAttachmentMapper.insert(att);
        return att.getId();
    }

    @Transactional
    public void removeAttachment(Long evaluationId, Long attachmentId, User caller) {
        Evaluation entity = loadEntity(evaluationId);
        checkWritePermission(entity, caller);
        evaluationAttachmentMapper.softDelete(attachmentId);
    }

    // ---------- helpers ----------

    private Evaluation loadEntity(Long id) {
        Evaluation e = evaluationMapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("Evaluation", "id", id);
        return e;
    }

    private void validateCreate(EvaluationCreateRequest request) {
        if (request == null) throw new BadRequestException("요청 바디가 비어있습니다.");
        if (request.getPeriodYear() == null) throw new BadRequestException("periodYear는 필수입니다.");
        if (request.getPeriodHalf() == null
                || !(request.getPeriodHalf().equals("H1") || request.getPeriodHalf().equals("H2"))) {
            throw new BadRequestException("periodHalf는 'H1' 또는 'H2'여야 합니다.");
        }
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) return "REGULAR";
        String up = type.toUpperCase();
        if (!"REGULAR".equals(up) && !"SPECIAL".equals(up)) {
            throw new BadRequestException("evaluationType은 REGULAR/SPECIAL 이어야 합니다.");
        }
        return up;
    }

    private List<EvaluationItem> loadItemsForRequest(List<EvaluationCreateRequest.ItemScoreInput> inputs) {
        if (inputs == null || inputs.isEmpty()) {
            return evaluationItemMapper.findAll(true);
        }
        List<Long> ids = new ArrayList<>();
        for (EvaluationCreateRequest.ItemScoreInput in : inputs) {
            if (in.getItemId() != null) ids.add(in.getItemId());
        }
        if (ids.isEmpty()) return evaluationItemMapper.findAll(true);
        return evaluationItemMapper.findByIds(ids);
    }

    /** 점수 계산:
     *  weighted_score = score * weight
     *  total_score    = Σ weighted_score
     *  max_total_score= Σ (max_score * weight)
     *  score_percentage = total_score / max_total_score * 100
     *  qualified      = score_percentage >= threshold
     */
    private ScoreCalc calculateScores(List<EvaluationItem> items,
                                      List<EvaluationCreateRequest.ItemScoreInput> inputs) {
        Map<Long, EvaluationCreateRequest.ItemScoreInput> inputMap = new HashMap<>();
        if (inputs != null) {
            for (EvaluationCreateRequest.ItemScoreInput in : inputs) {
                if (in.getItemId() != null) inputMap.put(in.getItemId(), in);
            }
        }

        List<EvaluationItemScore> rows = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal maxTotal = BigDecimal.ZERO;

        for (EvaluationItem item : items) {
            BigDecimal weight = item.getWeight() == null ? BigDecimal.ONE : item.getWeight();
            BigDecimal maxScore = BigDecimal.valueOf(item.getMaxScore() == null ? 10 : item.getMaxScore());

            EvaluationCreateRequest.ItemScoreInput in = inputMap.get(item.getId());
            boolean na = in != null && Boolean.TRUE.equals(in.getNotApplicable());

            // PPT slide 20: '자료없음' 체크된 항목은 total/maxTotal 모두에서 제외한다
            BigDecimal score = na ? null : (in != null ? in.getScore() : null);
            BigDecimal weighted = score != null ? score.multiply(weight) : null;
            if (!na) {
                maxTotal = maxTotal.add(maxScore.multiply(weight));
                if (weighted != null) total = total.add(weighted);
            }

            rows.add(EvaluationItemScore.builder()
                    .itemId(item.getId())
                    .score(score)
                    .maxScore(maxScore)
                    .weight(weight)
                    .weightedScore(weighted)
                    .notApplicable(na)
                    .comment(in != null ? in.getComment() : null)
                    .build());
        }

        BigDecimal percentage = BigDecimal.ZERO;
        if (maxTotal.signum() > 0) {
            percentage = total.multiply(BigDecimal.valueOf(100))
                    .divide(maxTotal, 2, RoundingMode.HALF_UP);
        }

        ScoreCalc result = new ScoreCalc();
        result.totalScore = total.setScale(2, RoundingMode.HALF_UP);
        result.maxTotalScore = maxTotal.setScale(2, RoundingMode.HALF_UP);
        result.scorePercentage = percentage;
        result.scoreRows = rows;
        return result;
    }

    private String generateEvaluationNo(Integer periodYear, String periodHalf) {
        Integer max = evaluationMapper.findMaxSeqByYearHalf(periodYear, periodHalf);
        int next = (max == null ? 0 : max) + 1;
        String nn = "H1".equals(periodHalf) ? "01" : "02";
        return String.format("EV-%04d%s-%04d", periodYear, nn, next);
    }

    private EvaluationDetailResponse.AttachmentItem toAttachmentItem(EvaluationAttachment a) {
        return EvaluationDetailResponse.AttachmentItem.builder()
                .id(a.getId())
                .itemId(a.getItemId())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .fileSize(a.getFileSize())
                .mimeType(a.getMimeType())
                .uploadedBy(a.getUploadedBy())
                .uploadedAt(a.getUploadedAt())
                .build();
    }

    private void notifyCompanyContractors(Long companyId, String subject, String body) {
        if (companyId == null) return;
        List<User> contractors = userMapper.findByRole("CONTRACTOR");
        for (User u : contractors) {
            if (companyId.equals(u.getCompanyId())) {
                notificationService.notifyUser(u.getId(), "EMAIL", subject, body);
            }
        }
    }

    private void checkViewPermission(Long companyId, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller) && companyId != null && companyId.equals(caller.getCompanyId())) return;
        throw new UnauthorizedException("해당 평가를 조회할 권한이 없습니다.");
    }

    private void checkWritePermission(Evaluation entity, User caller) {
        if (caller == null) throw new UnauthorizedException("Not authenticated");
        if (isAdminOrContractDept(caller)) return;
        if (isContractor(caller) && entity.getCompanyId() != null
                && entity.getCompanyId().equals(caller.getCompanyId())) return;
        throw new UnauthorizedException("해당 평가를 수정할 권한이 없습니다.");
    }

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String role = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(role) || "CONTRACT_DEPT".equals(role);
    }

    // ---------- internal ----------

    private static class ScoreCalc {
        BigDecimal totalScore;
        BigDecimal maxTotalScore;
        BigDecimal scorePercentage;
        List<EvaluationItemScore> scoreRows;

        Boolean qualified(BigDecimal threshold) {
            if (scorePercentage == null || threshold == null) return null;
            return scorePercentage.compareTo(threshold) >= 0;
        }
    }
}
