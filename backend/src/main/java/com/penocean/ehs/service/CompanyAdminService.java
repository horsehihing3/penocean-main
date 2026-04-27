package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.CompanyCreateRequest;
import com.penocean.ehs.dto.request.CompanyUpdateRequest;
import com.penocean.ehs.dto.response.CompanyListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.CompanyMapper;
import com.penocean.ehs.model.Company;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyAdminService {

    private final CompanyMapper companyMapper;

    @Transactional(readOnly = true)
    public PageResponse<CompanyListItem> list(String keyword, String status, String industryCode,
                                              int page, int size) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        List<CompanyListItem> content = companyMapper.findPage(keyword, status, industryCode, offset, s);
        long total = companyMapper.countPage(keyword, status, industryCode);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional(readOnly = true)
    public Company detail(Long id) {
        Company c = companyMapper.findById(id);
        if (c == null) throw new ResourceNotFoundException("Company", "id", id);
        return c;
    }

    @Transactional
    public Long create(CompanyCreateRequest request, User caller) {
        assertAdmin(caller);
        if (request.getBusinessNumber() == null || request.getBusinessNumber().isBlank()) {
            throw new BadRequestException("사업자번호는 필수입니다.");
        }
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("업체명은 필수입니다.");
        }
        Company existing = companyMapper.findByBusinessNumber(request.getBusinessNumber());
        if (existing != null) {
            throw new BadRequestException("이미 등록된 사업자번호입니다.");
        }
        Company c = Company.builder()
                .businessNumber(request.getBusinessNumber())
                .name(request.getName())
                .nameEn(request.getNameEn())
                .ceoName(request.getCeoName())
                .postalCode(request.getPostalCode())
                .address(request.getAddress())
                .addressDetail(request.getAddressDetail())
                .phone(request.getPhone())
                .email(request.getEmail())
                .industryCode(request.getIndustryCode())
                .industryOther(request.getIndustryOther())
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .contractStartDate(request.getContractStartDate())
                .contractEndDate(request.getContractEndDate())
                .deleted(false)
                .build();
        companyMapper.insert(c);
        log.info("Company created by admin: id={}, bizNo={}, userId={}",
                c.getId(), c.getBusinessNumber(), caller.getId());
        return c.getId();
    }

    @Transactional
    public void update(Long id, CompanyUpdateRequest request, User caller) {
        assertAdmin(caller);
        Company c = companyMapper.findById(id);
        if (c == null) throw new ResourceNotFoundException("Company", "id", id);
        if (request.getName() != null) c.setName(request.getName());
        if (request.getCeoName() != null) c.setCeoName(request.getCeoName());
        if (request.getAddress() != null) c.setAddress(request.getAddress());
        if (request.getPhone() != null) c.setPhone(request.getPhone());
        if (request.getEmail() != null) c.setEmail(request.getEmail());
        if (request.getIndustryCode() != null) c.setIndustryCode(request.getIndustryCode());
        if (request.getStatus() != null) c.setStatus(request.getStatus());
        if (request.getContractStartDate() != null) c.setContractStartDate(request.getContractStartDate());
        if (request.getContractEndDate() != null) c.setContractEndDate(request.getContractEndDate());
        companyMapper.update(c);
    }

    @Transactional
    public void inactivate(Long id, User caller) {
        assertAdmin(caller);
        Company c = companyMapper.findById(id);
        if (c == null) throw new ResourceNotFoundException("Company", "id", id);
        companyMapper.inactivate(id);
    }

    private void assertAdmin(User u) {
        if (u == null || u.getRoleCode() == null) throw new UnauthorizedException("Not authenticated");
        if (!"ADMIN".equalsIgnoreCase(u.getRoleCode())) {
            throw new UnauthorizedException("업체관리 권한이 없습니다.");
        }
    }
}
