package com.penocean.ehs.service;

import com.penocean.ehs.dto.response.ProcedureDocResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.ProcedureDocMapper;
import com.penocean.ehs.model.ProcedureDoc;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProcedureDocService {

    private static final Set<String> VALID_TYPES = Set.of("ACCESS_SAFETY", "RISK_ASSESSMENT");

    private final ProcedureDocMapper mapper;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public ProcedureDocResponse getLatest(String procType) {
        validateType(procType);
        return mapper.findLatestByProcType(procType);
    }

    @Transactional(readOnly = true)
    public ProcedureDoc getEntity(Long id) {
        ProcedureDoc doc = mapper.findById(id);
        if (doc == null) throw new ResourceNotFoundException("ProcedureDoc", "id", id);
        return doc;
    }

    @Transactional
    public Long upload(String procType, FileStorageService.Stored stored, User caller) {
        assertAdmin(caller);
        validateType(procType);
        ProcedureDoc doc = ProcedureDoc.builder()
                .procType(procType)
                .fileName(stored.originalName())
                .filePath(stored.relativePath())
                .fileSize(stored.size())
                .mimeType(stored.contentType())
                .uploadedBy(caller.getId())
                .build();
        mapper.insert(doc);
        log.info("ProcedureDoc uploaded: type={}, id={}, file={}", procType, doc.getId(), stored.originalName());
        return doc.getId();
    }

    @Transactional
    public void delete(Long id, User caller) {
        assertAdmin(caller);
        getEntity(id);
        mapper.softDelete(id);
        log.info("ProcedureDoc soft-deleted: id={}", id);
    }

    private void validateType(String procType) {
        if (procType == null || !VALID_TYPES.contains(procType)) {
            throw new BadRequestException("procType은 ACCESS_SAFETY 또는 RISK_ASSESSMENT 이어야 합니다.");
        }
    }

    private void assertAdmin(User u) {
        if (u == null || u.getRoleCode() == null) throw new UnauthorizedException("Not authenticated");
        if (!"ADMIN".equals(u.getRoleCode().toUpperCase())) {
            throw new UnauthorizedException("절차서 관리는 ADMIN만 가능합니다.");
        }
    }
}
