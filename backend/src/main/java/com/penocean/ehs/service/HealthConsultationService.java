package com.penocean.ehs.service;

import com.penocean.ehs.dto.request.HealthConsultationCreateRequest;
import com.penocean.ehs.dto.response.HealthConsultationResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.HealthConsultationMapper;
import com.penocean.ehs.model.HealthConsultation;
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
public class HealthConsultationService {

    private final HealthConsultationMapper consultationMapper;

    @Transactional(readOnly = true)
    public List<HealthConsultationResponse> listByUser(Long userId, User caller) {
        Long effective = userId;
        if (isContractor(caller)) effective = caller.getId();
        if (effective == null) effective = caller.getId();
        if (!isAdminOrContractDept(caller) && !caller.getId().equals(effective)) {
            throw new UnauthorizedException("본인 상담 내역만 조회할 수 있습니다.");
        }
        return consultationMapper.findByUser(effective);
    }

    @Transactional
    public Long create(HealthConsultationCreateRequest request, User caller) {
        if (request == null) throw new BadRequestException("요청이 비어있습니다.");
        Long userId = request.getUserId();
        if (userId == null) userId = caller.getId();
        if (isContractor(caller) && !caller.getId().equals(userId)) {
            throw new UnauthorizedException("본인 상담만 등록할 수 있습니다.");
        }
        HealthConsultation entity = HealthConsultation.builder()
                .userId(userId)
                .consultationDate(request.getConsultationDate() != null ? request.getConsultationDate() : LocalDate.now())
                .consultantName(request.getConsultantName())
                .topic(request.getTopic())
                .content(request.getContent())
                .actionItems(request.getActionItems())
                .build();
        consultationMapper.insert(entity);
        return entity.getId();
    }

    private boolean isContractor(User u) {
        return u != null && "CONTRACTOR".equalsIgnoreCase(u.getRoleCode());
    }

    private boolean isAdminOrContractDept(User u) {
        if (u == null || u.getRoleCode() == null) return false;
        String r = u.getRoleCode().toUpperCase();
        return "ADMIN".equals(r) || "CONTRACT_DEPT".equals(r);
    }
}
