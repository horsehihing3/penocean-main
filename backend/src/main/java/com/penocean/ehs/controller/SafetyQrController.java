package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.dto.request.SafetyQrCompleteRequest;
import com.penocean.ehs.dto.request.SafetyQrCreateRequest;
import com.penocean.ehs.dto.response.SafetyQrRecordResponse;
import com.penocean.ehs.dto.response.SafetyQrResponse;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.SafetyQr;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.SafetyQrService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "SafetyQr", description = "QR 안전교육 이수 API")
public class SafetyQrController {

    private final SafetyQrService service;
    private final UserMapper userMapper;

    // ── 관리자 전용 ────────────────────────────────────────────

    @GetMapping("/admin/safety-qr")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "QR 목록 (관리자)")
    public ResponseEntity<ApiResponse<List<SafetyQrResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.success(service.listAll()));
    }

    @GetMapping("/admin/safety-qr/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "QR 상세 (관리자)")
    public ResponseEntity<ApiResponse<SafetyQrResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getById(id)));
    }

    @PostMapping("/admin/safety-qr")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "QR 생성 (관리자)")
    public ResponseEntity<ApiResponse<SafetyQrResponse>> create(
            @RequestBody SafetyQrCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success("QR코드가 생성되었습니다.", service.create(request, caller.getUsername())));
    }

    @PostMapping("/admin/safety-qr/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "QR 비활성화 (관리자)")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        service.deactivate(id);
        return ResponseEntity.ok(ApiResponse.success("비활성화되었습니다.", null));
    }

    @GetMapping("/admin/safety-qr/{id}/records")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "QR 이수 기록 조회 (관리자)")
    public ResponseEntity<ApiResponse<List<SafetyQrRecordResponse>>> records(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.getRecords(id)));
    }

    // ── 공개 (비로그인) ─────────────────────────────────────────

    @GetMapping("/public/safety-qr/{token}")
    @Operation(summary = "QR 세션 정보 조회 (공개)")
    public ResponseEntity<ApiResponse<SafetyQr>> publicInfo(@PathVariable String token) {
        return ResponseEntity.ok(ApiResponse.success(service.getByToken(token)));
    }

    @PostMapping("/public/safety-qr/{token}/complete")
    @Operation(summary = "안전교육 이수 완료 제출 (공개)")
    public ResponseEntity<ApiResponse<Map<String, String>>> complete(
            @PathVariable String token,
            @RequestBody SafetyQrCompleteRequest request) {
        service.complete(token, request);
        return ResponseEntity.ok(ApiResponse.success("이수가 완료되었습니다.", Map.of("status", "completed")));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new UnauthorizedException("User not found");
        return u;
    }
}
