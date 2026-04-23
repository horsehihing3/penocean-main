package com.penocean.ehs.service;

import com.penocean.ehs.dto.request.SafetyRuleSaveRequest;
import com.penocean.ehs.dto.response.SafetyRuleResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.SafetyRuleMapper;
import com.penocean.ehs.model.SafetyRule;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SafetyRuleService {

    private final SafetyRuleMapper ruleMapper;

    @Transactional(readOnly = true)
    public List<SafetyRuleResponse> list(String industryCode, boolean activeOnly) {
        List<SafetyRule> rules = ruleMapper.findAll(industryCode, activeOnly);
        List<SafetyRuleResponse> result = new ArrayList<>();
        for (SafetyRule r : rules) result.add(toResponse(r));
        return result;
    }

    @Transactional
    public Long create(SafetyRuleSaveRequest request, User caller) {
        assertAdmin(caller);
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("title은 필수입니다.");
        }
        SafetyRule r = SafetyRule.builder()
                .industryCode(request.getIndustryCode())
                .ruleNo(request.getRuleNo())
                .title(request.getTitle())
                .content(request.getContent())
                .severity(normalizeSeverity(request.getSeverity()))
                .sortOrder(request.getSortOrder())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();
        ruleMapper.insert(r);
        return r.getId();
    }

    @Transactional
    public void update(Long id, SafetyRuleSaveRequest request, User caller) {
        assertAdmin(caller);
        SafetyRule e = ruleMapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("SafetyRule", "id", id);
        e.setIndustryCode(request.getIndustryCode() != null ? request.getIndustryCode() : e.getIndustryCode());
        e.setRuleNo(request.getRuleNo() != null ? request.getRuleNo() : e.getRuleNo());
        e.setTitle(request.getTitle() != null ? request.getTitle() : e.getTitle());
        e.setContent(request.getContent() != null ? request.getContent() : e.getContent());
        e.setSeverity(request.getSeverity() != null ? normalizeSeverity(request.getSeverity()) : e.getSeverity());
        e.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : e.getSortOrder());
        e.setActive(request.getActive() != null ? request.getActive() : e.getActive());
        ruleMapper.update(e);
    }

    @Transactional
    public void reorder(Long id, Integer sortOrder, User caller) {
        assertAdmin(caller);
        if (sortOrder == null) throw new BadRequestException("sortOrder는 필수입니다.");
        ruleMapper.updateSortOrder(id, sortOrder);
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        assertAdmin(caller);
        ruleMapper.softDelete(id);
    }

    private String normalizeSeverity(String s) {
        if (s == null || s.isBlank()) return "NORMAL";
        String up = s.toUpperCase();
        if (!"NORMAL".equals(up) && !"CAUTION".equals(up) && !"WARNING".equals(up) && !"CRITICAL".equals(up)) {
            throw new BadRequestException("severity는 NORMAL/CAUTION/WARNING/CRITICAL 이어야 합니다.");
        }
        return up;
    }

    private void assertAdmin(User u) {
        if (u == null || u.getRoleCode() == null) throw new UnauthorizedException("Not authenticated");
        if (!"ADMIN".equalsIgnoreCase(u.getRoleCode())) {
            throw new UnauthorizedException("안전수칙 관리 권한이 없습니다.");
        }
    }

    private SafetyRuleResponse toResponse(SafetyRule r) {
        return SafetyRuleResponse.builder()
                .id(r.getId())
                .industryCode(r.getIndustryCode())
                .ruleNo(r.getRuleNo())
                .title(r.getTitle())
                .content(r.getContent())
                .severity(r.getSeverity())
                .sortOrder(r.getSortOrder())
                .active(r.getActive())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
