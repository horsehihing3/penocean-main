package com.penocean.ehs.service;

import com.penocean.ehs.dto.request.EvaluationItemReorderRequest;
import com.penocean.ehs.dto.request.EvaluationItemSaveRequest;
import com.penocean.ehs.dto.response.EvaluationItemResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.EvaluationItemMapper;
import com.penocean.ehs.model.EvaluationItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EvaluationItemService {

    private final EvaluationItemMapper mapper;

    @Transactional(readOnly = true)
    public List<EvaluationItemResponse> list(boolean activeOnly) {
        return mapper.findAll(activeOnly).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EvaluationItemResponse get(Long id) {
        return toResponse(loadEntity(id));
    }

    @Transactional
    public Long create(EvaluationItemSaveRequest request) {
        validate(request);
        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new BadRequestException("code는 필수입니다.");
        }
        if (mapper.findByCode(request.getCode()) != null) {
            throw new BadRequestException("이미 사용 중인 code입니다: " + request.getCode());
        }
        EvaluationItem entity = EvaluationItem.builder()
                .code(request.getCode())
                .category(request.getCategory())
                .title(request.getTitle())
                .description(request.getDescription())
                .maxScore(request.getMaxScore() == null ? 10 : request.getMaxScore())
                .weight(request.getWeight() == null ? BigDecimal.ONE : request.getWeight())
                .sortOrder(request.getSortOrder() == null ? 0 : request.getSortOrder())
                .active(request.getActive() == null ? Boolean.TRUE : request.getActive())
                .build();
        mapper.insert(entity);
        log.info("EvaluationItem created: id={}, code={}", entity.getId(), entity.getCode());
        return entity.getId();
    }

    @Transactional
    public void update(Long id, EvaluationItemSaveRequest request) {
        EvaluationItem entity = loadEntity(id);
        validate(request);
        if (request.getCode() != null && !request.getCode().equals(entity.getCode())) {
            EvaluationItem dup = mapper.findByCode(request.getCode());
            if (dup != null && !dup.getId().equals(id)) {
                throw new BadRequestException("이미 사용 중인 code입니다: " + request.getCode());
            }
            entity.setCode(request.getCode());
        }
        if (request.getCategory() != null) entity.setCategory(request.getCategory());
        if (request.getTitle() != null) entity.setTitle(request.getTitle());
        entity.setDescription(request.getDescription());
        if (request.getMaxScore() != null) entity.setMaxScore(request.getMaxScore());
        if (request.getWeight() != null) entity.setWeight(request.getWeight());
        if (request.getSortOrder() != null) entity.setSortOrder(request.getSortOrder());
        if (request.getActive() != null) entity.setActive(request.getActive());
        mapper.update(entity);
        log.info("EvaluationItem updated: id={}", id);
    }

    @Transactional
    public void delete(Long id) {
        loadEntity(id);
        mapper.softDelete(id);
        log.info("EvaluationItem soft-deleted: id={}", id);
    }

    @Transactional
    public void reorder(EvaluationItemReorderRequest request) {
        if (request == null || request.getItems() == null) return;
        for (EvaluationItemReorderRequest.Entry e : request.getItems()) {
            if (e.getId() == null || e.getSortOrder() == null) continue;
            mapper.updateSortOrder(e.getId(), e.getSortOrder());
        }
    }

    private void validate(EvaluationItemSaveRequest request) {
        if (request == null) throw new BadRequestException("요청 바디가 비어있습니다.");
        if (request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("title은 필수입니다.");
        }
        if (request.getMaxScore() != null && request.getMaxScore() <= 0) {
            throw new BadRequestException("maxScore는 양수여야 합니다.");
        }
        if (request.getWeight() != null && request.getWeight().signum() < 0) {
            throw new BadRequestException("weight는 0 이상이어야 합니다.");
        }
    }

    private EvaluationItem loadEntity(Long id) {
        EvaluationItem e = mapper.findById(id);
        if (e == null) throw new ResourceNotFoundException("EvaluationItem", "id", id);
        return e;
    }

    private EvaluationItemResponse toResponse(EvaluationItem e) {
        return EvaluationItemResponse.builder()
                .id(e.getId())
                .code(e.getCode())
                .category(e.getCategory())
                .title(e.getTitle())
                .description(e.getDescription())
                .maxScore(e.getMaxScore())
                .weight(e.getWeight())
                .sortOrder(e.getSortOrder())
                .active(e.getActive())
                .build();
    }
}
