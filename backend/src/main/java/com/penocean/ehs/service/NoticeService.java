package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.NoticeCreateRequest;
import com.penocean.ehs.dto.request.NoticeUpdateRequest;
import com.penocean.ehs.dto.response.NoticeDetailResponse;
import com.penocean.ehs.dto.response.NoticeListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.NoticeMapper;
import com.penocean.ehs.model.Notice;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeMapper noticeMapper;

    @Transactional(readOnly = true)
    public PageResponse<NoticeListItem> list(String category, String keyword,
                                             int page, int size, User caller) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        List<NoticeListItem> content = noticeMapper.findPage(category, keyword, offset, s);
        long total = noticeMapper.count(category, keyword);
        return PageResponse.of(content, total, p, s);
    }

    @Transactional
    public NoticeDetailResponse detail(Long id, User caller) {
        NoticeDetailResponse d = noticeMapper.findByIdWithDetail(id);
        if (d == null) throw new ResourceNotFoundException("Notice", "id", id);
        if (caller != null && caller.getId() != null
                && !noticeMapper.hasViewed(id, caller.getId())) {
            noticeMapper.insertView(id, caller.getId());
            noticeMapper.incrementViewCount(id);
            d.setViewCount(d.getViewCount() + 1);
        }
        return d;
    }

    @Transactional
    public Long create(NoticeCreateRequest request, User caller) {
        assertAdmin(caller);
        if (request == null || request.getTitle() == null || request.getTitle().isBlank()) {
            throw new BadRequestException("title은 필수입니다.");
        }
        Notice n = Notice.builder()
                .category(normalizeCategory(request.getCategory()))
                .title(request.getTitle())
                .content(request.getContent())
                .authorUserId(caller.getId())
                .pinned(Boolean.TRUE.equals(request.getPinned()))
                .expiresAt(toDateTime(request.getExpiresAt()))
                .build();
        noticeMapper.insert(n);
        log.info("Notice created: id={}, authorId={}", n.getId(), caller.getId());
        return n.getId();
    }

    @Transactional
    public void update(Long id, NoticeUpdateRequest request, User caller) {
        assertAdmin(caller);
        Notice entity = loadEntity(id);
        entity.setCategory(request.getCategory() != null ? normalizeCategory(request.getCategory()) : entity.getCategory());
        entity.setTitle(request.getTitle() != null ? request.getTitle() : entity.getTitle());
        entity.setContent(request.getContent() != null ? request.getContent() : entity.getContent());
        entity.setPinned(request.getPinned() != null ? request.getPinned() : entity.getPinned());
        entity.setExpiresAt(request.getExpiresAt() != null ? toDateTime(request.getExpiresAt()) : entity.getExpiresAt());
        noticeMapper.update(entity);
    }

    @Transactional
    public void pin(Long id, boolean pinned, User caller) {
        assertAdmin(caller);
        loadEntity(id);
        noticeMapper.updatePinned(id, pinned);
    }

    @Transactional
    public void softDelete(Long id, User caller) {
        assertAdmin(caller);
        loadEntity(id);
        noticeMapper.softDelete(id);
    }

    private Notice loadEntity(Long id) {
        Notice n = noticeMapper.findById(id);
        if (n == null) throw new ResourceNotFoundException("Notice", "id", id);
        return n;
    }

    private String normalizeCategory(String c) {
        if (c == null || c.isBlank()) return "NOTICE";
        String up = c.toUpperCase();
        if (!"NOTICE".equals(up) && !"ANNOUNCEMENT".equals(up) && !"URGENT".equals(up)) {
            throw new BadRequestException("category는 NOTICE/ANNOUNCEMENT/URGENT 여야 합니다.");
        }
        return up;
    }

    private LocalDateTime toDateTime(LocalDate date) {
        return date != null ? date.atStartOfDay() : null;
    }

    private void assertAdmin(User u) {
        if (u == null || u.getRoleCode() == null) throw new UnauthorizedException("Not authenticated");
        String r = u.getRoleCode().toUpperCase();
        if (!"ADMIN".equals(r)) {
            throw new UnauthorizedException("공지 관리 권한이 없습니다.");
        }
    }
}
