package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.ApprovalActionRequest;
import com.penocean.ehs.dto.response.ApprovalDetailResponse;
import com.penocean.ehs.dto.response.ApprovalListItemResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.ApprovalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/approvals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Approval", description = "가입 승인 관리 API (ADMIN 전용)")
public class ApprovalController {

    private final ApprovalService approvalService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "가입 신청 목록", description = "status 필터(기본 PENDING)와 keyword 검색 지원")
    public ResponseEntity<ApiResponse<PageResponse<ApprovalListItemResponse>>> list(
            @RequestParam(required = false, defaultValue = "PENDING") String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        PageResponse<ApprovalListItemResponse> result = approvalService.list(status, keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "가입 신청 상세")
    public ResponseEntity<ApiResponse<ApprovalDetailResponse>> detail(@PathVariable Long userId) {
        ApprovalDetailResponse detail = approvalService.detail(userId);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping("/{userId}/approve")
    @Operation(summary = "가입 승인")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable Long userId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long approverId = resolveApproverId(userDetails);
        approvalService.approve(userId, approverId);
        return ResponseEntity.ok(ApiResponse.success("승인되었습니다", null));
    }

    @PostMapping("/{userId}/reject")
    @Operation(summary = "가입 반려")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable Long userId,
            @RequestBody(required = false) ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long approverId = resolveApproverId(userDetails);
        String reason = request == null ? null : request.getReason();
        approvalService.reject(userId, reason, approverId);
        return ResponseEntity.ok(ApiResponse.success("반려되었습니다", null));
    }

    private Long resolveApproverId(UserDetails userDetails) {
        if (userDetails == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        User approver = userMapper.findByUsername(userDetails.getUsername());
        if (approver == null) {
            throw new ResourceNotFoundException("Approver user not found");
        }
        return approver.getId();
    }
}
