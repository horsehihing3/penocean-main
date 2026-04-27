package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.FormTemplateCreateRequest;
import com.penocean.ehs.dto.response.FormTemplateResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.FormTemplateMapper;
import com.penocean.ehs.model.FormTemplate;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FormTemplateService {

    private final FormTemplateMapper formMapper;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public PageResponse<FormTemplateResponse> list(String category, String keyword, boolean activeOnly,
                                                   int page, int size) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        List<FormTemplateResponse> content = formMapper.findPage(category, keyword, activeOnly, offset, s);
        long total = formMapper.count(category, keyword, activeOnly);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional
    public FormTemplateResponse detail(Long id) {
        FormTemplateResponse f = formMapper.findByIdWithDetail(id);
        if (f == null) throw new ResourceNotFoundException("FormTemplate", "id", id);
        formMapper.incrementDownloadCount(id);
        return f;
    }

    @Transactional(readOnly = true)
    public FormTemplate getEntity(Long id) {
        FormTemplate f = formMapper.findById(id);
        if (f == null) throw new ResourceNotFoundException("FormTemplate", "id", id);
        return f;
    }

    @Transactional
    public Long create(FormTemplateCreateRequest request,
                       FileStorageService.Stored stored, User caller) {
        assertAdmin(caller);
        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new BadRequestException("code는 필수입니다.");
        }
        if (formMapper.existsByCode(request.getCode()) > 0) {
            throw new BadRequestException("동일 code의 양식이 이미 존재합니다.");
        }
        FormTemplate f = FormTemplate.builder()
                .code(request.getCode())
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .version(request.getVersion())
                .fileName(stored.originalName())
                .filePath(stored.relativePath())
                .fileSize(stored.size())
                .mimeType(stored.contentType())
                .uploadedBy(caller.getId())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();
        formMapper.insert(f);
        log.info("FormTemplate created: id={}, code={}", f.getId(), f.getCode());
        return f.getId();
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        assertAdmin(caller);
        getEntity(id);
        formMapper.softDelete(id);
    }

    private void assertAdmin(User u) {
        if (u == null || u.getRoleCode() == null) throw new UnauthorizedException("Not authenticated");
        String r = u.getRoleCode().toUpperCase();
        if (!"ADMIN".equals(r) && !"CONTRACT_DEPT".equals(r)) {
            throw new UnauthorizedException("양식 관리 권한이 없습니다.");
        }
    }
}
