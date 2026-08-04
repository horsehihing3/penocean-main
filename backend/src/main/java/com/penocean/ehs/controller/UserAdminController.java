// 관리자 전용 전체 사용자 관리 REST API
package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.AdminPasswordResetRequest;
import com.penocean.ehs.dto.request.AdminUserUpdateRequest;
import com.penocean.ehs.dto.response.UserResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "UserAdmin", description = "관리자 사용자 관리 API")
public class UserAdminController {

    private final UserAdminService userAdminService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "사용자 검색", description = "역할·상태·키워드로 전체 사용자를 조회한다")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> search(
            @RequestParam(required = false) String roleCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                userAdminService.search(roleCode, status, keyword, page, size)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "사용자 정보 수정")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody AdminUserUpdateRequest request,
            @AuthenticationPrincipal UserDetails actor) {
        userAdminService.update(id, request, requireActorId(actor));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PatchMapping("/{id}/password")
    @Operation(summary = "비밀번호 변경", description = "관리자가 사용자 비밀번호를 재설정한다")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @PathVariable Long id,
            @RequestBody AdminPasswordResetRequest request,
            @AuthenticationPrincipal UserDetails actor) {
        userAdminService.resetPassword(id, request, requireActorId(actor));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "사용자 탈퇴 처리", description = "soft delete (deleted = 1)")
    public ResponseEntity<ApiResponse<Void>> withdraw(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails actor) {
        userAdminService.withdraw(id, requireActorId(actor));
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /** 프로젝트 공통 패턴 — UserDetails 에서 실제 사용자 id 를 해석 */
    private Long requireActorId(UserDetails actor) {
        if (actor == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(actor.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", actor.getUsername());
        return u.getId();
    }
}
