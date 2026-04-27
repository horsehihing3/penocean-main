package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.AuditInspectionCreateRequest;
import com.penocean.ehs.dto.response.AuditInspectionDetailResponse;
import com.penocean.ehs.dto.response.AuditInspectionListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.AuditInspectionMapper;
import com.penocean.ehs.model.AuditInspection;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditInspectionService {

    private final AuditInspectionMapper auditMapper;

    @Transactional(readOnly = true)
    public PageResponse<AuditInspectionListItem> list(String inspectionType, String status,
                                                      LocalDate dateFrom, LocalDate dateTo,
                                                      int page, int size) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        List<AuditInspectionListItem> content = auditMapper.findPage(
                inspectionType, status, dateFrom, dateTo, offset, s);
        long total = auditMapper.count(inspectionType, status, dateFrom, dateTo);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public AuditInspectionDetailResponse detail(Long id) {
        AuditInspectionDetailResponse d = auditMapper.findByIdWithDetail(id);
        if (d == null) throw new ResourceNotFoundException("AuditInspection", "id", id);
        return d;
    }

    @Transactional
    public Long create(AuditInspectionCreateRequest request, User caller) {
        assertAdmin(caller);
        if (request == null || request.getInspectionDate() == null) {
            throw new BadRequestException("inspectionDate는 필수입니다.");
        }
        AuditInspection a = AuditInspection.builder()
                .inspectionType(normalizeType(request.getInspectionType()))
                .targetCompanyId(request.getTargetCompanyId())
                .targetVesselId(request.getTargetVesselId())
                .inspectionDate(request.getInspectionDate())
                .inspectorUserId(caller.getId())
                .findings(request.getFindings())
                .actionItems(request.getActionItems())
                .status("OPEN")
                .build();
        auditMapper.insert(a);
        log.info("AuditInspection created: id={}, inspectorId={}", a.getId(), caller.getId());
        return a.getId();
    }

    @Transactional
    public void updateStatus(Long id, String status, User caller) {
        assertAdmin(caller);
        if (status == null || status.isBlank()) throw new BadRequestException("status는 필수입니다.");
        String up = status.toUpperCase();
        if (!"OPEN".equals(up) && !"CLOSED".equals(up)) {
            throw new BadRequestException("status는 OPEN/CLOSED 이어야 합니다.");
        }
        AuditInspection a = auditMapper.findById(id);
        if (a == null) throw new ResourceNotFoundException("AuditInspection", "id", id);
        auditMapper.updateStatus(id, up);
    }

    private String normalizeType(String t) {
        if (t == null || t.isBlank()) return "REGULAR";
        String up = t.toUpperCase();
        if (!"REGULAR".equals(up) && !"SPECIAL".equals(up) && !"FOLLOW_UP".equals(up)) {
            throw new BadRequestException("inspectionType은 REGULAR/SPECIAL/FOLLOW_UP 이어야 합니다.");
        }
        return up;
    }

    private void assertAdmin(User u) {
        if (u == null || u.getRoleCode() == null) throw new UnauthorizedException("Not authenticated");
        String r = u.getRoleCode().toUpperCase();
        if (!"ADMIN".equals(r) && !"CONTRACT_DEPT".equals(r)) {
            throw new UnauthorizedException("감사점검 관리 권한이 없습니다.");
        }
    }
}
