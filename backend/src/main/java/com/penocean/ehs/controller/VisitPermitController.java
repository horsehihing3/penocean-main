package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.ApprovalActionRequest;
import com.penocean.ehs.dto.response.VisitPermitResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.VisitPermitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/visit-permits")
@RequiredArgsConstructor
@Tag(name = "VisitPermit", description = "Visit Permit API (출입신청 승인 시 자동 발급)")
public class VisitPermitController {

    private final VisitPermitService visitPermitService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "Visit Permit 목록")
    public ResponseEntity<ApiResponse<PageResponse<VisitPermitResponse>>> list(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long vesselId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate validTo,
            @RequestParam(required = false) Boolean revoked,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        // CONTRACTOR 는 자기 company 만
        Long effectiveCompanyId = companyId;
        if (caller != null && "CONTRACTOR".equalsIgnoreCase(caller.getRoleCode())) {
            effectiveCompanyId = caller.getCompanyId();
        }
        PageResponse<VisitPermitResponse> result =
                visitPermitService.list(effectiveCompanyId, vesselId, validFrom, validTo, revoked, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Visit Permit 상세")
    public ResponseEntity<ApiResponse<VisitPermitResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(visitPermitService.detail(id)));
    }

    @GetMapping("/by-access-request/{accessRequestId}")
    @Operation(summary = "출입신청 ID로 Visit Permit 조회")
    public ResponseEntity<ApiResponse<VisitPermitResponse>> byAccessRequest(@PathVariable Long accessRequestId) {
        return ResponseEntity.ok(ApiResponse.success(visitPermitService.findByAccessRequestId(accessRequestId)));
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Visit Permit 취소 (ADMIN)")
    public ResponseEntity<ApiResponse<Void>> revoke(
            @PathVariable Long id,
            @RequestBody(required = false) ApprovalActionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        String reason = request == null ? null : request.getReason();
        visitPermitService.revoke(id, reason, caller.getId());
        return ResponseEntity.ok(ApiResponse.success("취소되었습니다", null));
    }

    @GetMapping("/{id}/qr")
    @Operation(summary = "QR 표시용 간단 JSON (permit_no + validity)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> qr(@PathVariable Long id) {
        VisitPermitResponse detail = visitPermitService.detail(id);
        Map<String, Object> body = Map.of(
                "permitNo", detail.getPermitNo(),
                "validFrom", detail.getValidFrom(),
                "validTo", detail.getValidTo(),
                "revoked", detail.getRevoked() != null && detail.getRevoked(),
                "qrCodeUrl", detail.getQrCodeUrl() == null ? "" : detail.getQrCodeUrl()
        );
        return ResponseEntity.ok(ApiResponse.success(body));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) {
            throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        }
        return u;
    }
}
