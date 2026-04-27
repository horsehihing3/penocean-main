package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.EvaluationImprovementRequest;
import com.penocean.ehs.dto.request.EvaluationImprovementResponseRequest;
import com.penocean.ehs.dto.response.EvaluationImprovementResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.EvaluationHistoryMapper;
import com.penocean.ehs.mapper.EvaluationImprovementMapper;
import com.penocean.ehs.mapper.EvaluationMapper;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.Evaluation;
import com.penocean.ehs.model.EvaluationHistory;
import com.penocean.ehs.model.EvaluationImprovement;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationImprovementService {

    private final EvaluationImprovementMapper mapper;
    private final EvaluationMapper evaluationMapper;
    private final EvaluationHistoryMapper evaluationHistoryMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    private void logHistory(Long evalId, Long improvementId, String action, User actor, String detail) {
        evaluationHistoryMapper.insert(EvaluationHistory.builder()
                .evaluationId(evalId)
                .improvementId(improvementId)
                .action(action)
                .actorUserId(actor == null ? null : actor.getId())
                .actorName(actor == null ? null : actor.getName())
                .detail(detail)
                .build());
    }

    @Transactional(readOnly = true)
    public PageResponse<EvaluationImprovementResponse> list(Long evaluationId, String status,
                                                            int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;

        Long companyFilter = null;
        if (isContractor(caller)) {
            companyFilter = caller.getCompanyId();
            if (companyFilter == null) return PageResponse.of(new ArrayList<>(), 0, p, s);
        }

        List<EvaluationImprovementResponse> content =
                mapper.findPage(evaluationId, status, companyFilter, offset, s);
        long total = mapper.count(evaluationId, status, companyFilter);

        // dynamic OVERDUE 마킹
        LocalDate today = LocalDate.now();
        for (EvaluationImprovementResponse r : content) {
            if ("OPEN".equals(r.getStatus())
                    && r.getResponseDueDate() != null
                    && r.getResponseDueDate().isBefore(today)) {
                r.setStatus("OVERDUE");
            }
        }
        return PageResponse.of(content, total, p, s);
    }

    @Transactional
    public Long create(EvaluationImprovementRequest request, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("개선요청 생성 권한이 없습니다.");
        }
        if (request == null) throw new BadRequestException("요청 바디가 비어있습니다.");
        if (request.getEvaluationId() == null) throw new BadRequestException("evaluationId는 필수입니다.");
        if (request.getContent() == null || request.getContent().isBlank()) {
            throw new BadRequestException("content는 필수입니다.");
        }
        Evaluation eval = evaluationMapper.findById(request.getEvaluationId());
        if (eval == null) throw new ResourceNotFoundException("Evaluation", "id", request.getEvaluationId());

        EvaluationImprovement imp = EvaluationImprovement.builder()
                .evaluationId(request.getEvaluationId())
                .itemId(request.getItemId())
                .requestedBy(caller.getId())
                .requestContent(request.getContent())
                .responseDueDate(request.getResponseDueDate())
                .status("OPEN")
                .build();
        mapper.insert(imp);

        // 해당 업체 소속 CONTRACTOR 전원에게 알림
        notifyCompanyContractors(eval.getCompanyId(),
                "[팬오션] 평가 개선요청 접수",
                String.format("평가 %s 에 대한 개선요청이 접수되었습니다.%n내용: %s%s",
                        eval.getEvaluationNo(),
                        request.getContent(),
                        request.getResponseDueDate() != null
                                ? ("\n응답 기한: " + request.getResponseDueDate())
                                : ""));
        logHistory(eval.getId(), imp.getId(), "IMPROVE_REQUEST", caller,
                String.format("개선요청: %s", request.getContent()));
        log.info("EvaluationImprovement created: id={}, evaluationId={}", imp.getId(), request.getEvaluationId());
        return imp.getId();
    }

    @Transactional
    public void respond(Long id, EvaluationImprovementResponseRequest request, User caller) {
        EvaluationImprovement imp = load(id);
        Evaluation eval = evaluationMapper.findById(imp.getEvaluationId());
        if (eval == null) throw new ResourceNotFoundException("Evaluation", "id", imp.getEvaluationId());
        if (!isContractor(caller) || caller.getCompanyId() == null
                || !caller.getCompanyId().equals(eval.getCompanyId())) {
            throw new UnauthorizedException("해당 업체 CONTRACTOR만 응답할 수 있습니다.");
        }
        if ("CLOSED".equals(imp.getStatus())) {
            throw new BadRequestException("CLOSED 상태에는 응답할 수 없습니다.");
        }
        if (request == null || request.getResponseContent() == null || request.getResponseContent().isBlank()) {
            throw new BadRequestException("responseContent는 필수입니다.");
        }
        mapper.respond(id, request.getResponseContent(), caller.getId());
        // ADMIN/CONTRACT_DEPT 알림
        notificationService.notifyAdmins(
                "[팬오션] 평가 개선요청 응답",
                String.format("평가 %s 의 개선요청(#%d)에 응답이 등록되었습니다.",
                        eval.getEvaluationNo(), id));
        logHistory(eval.getId(), id, "IMPROVE_RESPOND", caller,
                String.format("개선요청 응답: %s", request.getResponseContent()));
        log.info("EvaluationImprovement responded: id={}, userId={}", id, caller.getId());
    }

    @Transactional
    public void close(Long id, User caller) {
        if (!isAdminOrContractDept(caller)) {
            throw new UnauthorizedException("종결 권한이 없습니다.");
        }
        EvaluationImprovement imp = load(id);
        if ("CLOSED".equals(imp.getStatus())) {
            throw new BadRequestException("이미 CLOSED 상태입니다.");
        }
        mapper.close(id);
        logHistory(imp.getEvaluationId(), id, "IMPROVE_CLOSE", caller, "개선요청이 종결되었습니다.");
        log.info("EvaluationImprovement closed: id={}", id);
    }

    private EvaluationImprovement load(Long id) {
        EvaluationImprovement e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("EvaluationImprovement", "id", id);
        return e;
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

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String role = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(role) || "CONTRACT_DEPT".equals(role);
    }
}
