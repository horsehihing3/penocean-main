// 관리자 전용 전체 사용자 관리 (조회·수정·비밀번호 변경·탈퇴)
package com.penocean.ehs.service;

import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.AdminPasswordResetRequest;
import com.penocean.ehs.dto.request.AdminUserUpdateRequest;
import com.penocean.ehs.dto.response.UserResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    private static final Set<String> ALLOWED_ROLES =
            Set.of("ADMIN", "CONTRACTOR", "CONTRACT_DEPT");
    private static final Set<String> ALLOWED_STATUS =
            Set.of("PENDING", "APPROVED", "REJECTED", "INACTIVE");

    /** 전체 사용자 검색 (역할·상태·키워드 필터 + 페이징) */
    public PageResponse<UserResponse> search(String roleCode, String status, String keyword,
                                             int page, int size) {
        int offset = page * size;
        List<UserResponse> content =
                userMapper.searchForAdmin(roleCode, status, keyword, offset, size);
        long total = userMapper.countForAdmin(roleCode, status, keyword);
        return PageResponse.of(content, total, page, size);
    }

    /** 사용자 정보 수정. 비밀번호는 이 경로로 변경되지 않는다. */
    @Transactional
    public void update(Long targetId, AdminUserUpdateRequest request, Long actorId) {
        User target = requireUser(targetId);

        if (request.getRoleCode() != null && !ALLOWED_ROLES.contains(request.getRoleCode())) {
            throw new BadRequestException("허용되지 않은 역할입니다");
        }
        if (request.getStatus() != null && !ALLOWED_STATUS.contains(request.getStatus())) {
            throw new BadRequestException("허용되지 않은 상태입니다");
        }

        // 본인 계정의 역할·상태를 스스로 낮추면 관리자 권한을 잃고 복구가 어려워진다
        if (targetId.equals(actorId)) {
            if (request.getRoleCode() != null && !"ADMIN".equals(request.getRoleCode())) {
                throw new BadRequestException("본인 계정의 역할은 변경할 수 없습니다");
            }
            if (request.getStatus() != null && !"APPROVED".equals(request.getStatus())) {
                throw new BadRequestException("본인 계정을 비활성화할 수 없습니다");
            }
        }

        target.setName(request.getName());
        target.setTitle(request.getTitle());
        target.setEmail(request.getEmail());
        target.setPhone(request.getPhone());
        target.setRoleCode(request.getRoleCode() != null ? request.getRoleCode() : target.getRoleCode());
        target.setStatus(request.getStatus() != null ? request.getStatus() : target.getStatus());
        userMapper.updateByAdmin(target);

        log.info("관리자 사용자 정보 수정 — actorId={}, targetId={}", actorId, targetId);
    }

    /**
     * 관리자에 의한 비밀번호 변경.
     * 평문은 저장·로그 어디에도 남기지 않고 BCrypt 해시만 기록한다.
     */
    @Transactional
    public void resetPassword(Long targetId, AdminPasswordResetRequest request, Long actorId) {
        requireUser(targetId);

        String raw = request.getNewPassword();
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("새 비밀번호를 입력해 주세요");
        }
        // 가입 화면과 동일한 정책 (8~20자, 영문/숫자/특수문자 각 1개 이상)
        if (!raw.matches("^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@!%#?&])[A-Za-z\\d@!%#?&]{8,20}$")) {
            throw new BadRequestException("비밀번호는 8~20자, 영문/숫자/특수문자[@!%#?&]를 각각 1개 이상 포함해야 합니다");
        }

        userMapper.updatePassword(targetId, passwordEncoder.encode(raw));
        log.info("관리자 비밀번호 변경 — actorId={}, targetId={}", actorId, targetId);
    }

    /** 사용자 탈퇴 처리 (soft delete — deleted = 1) */
    @Transactional
    public void withdraw(Long targetId, Long actorId) {
        requireUser(targetId);
        if (targetId.equals(actorId)) {
            throw new BadRequestException("본인 계정은 탈퇴 처리할 수 없습니다");
        }
        userMapper.delete(targetId);
        log.info("관리자 사용자 탈퇴 처리 — actorId={}, targetId={}", actorId, targetId);
    }

    private User requireUser(Long id) {
        User user = userMapper.findById(id);
        if (user == null || Boolean.TRUE.equals(user.getDeleted())) {
            throw new ResourceNotFoundException("사용자를 찾을 수 없습니다");
        }
        return user;
    }
}
