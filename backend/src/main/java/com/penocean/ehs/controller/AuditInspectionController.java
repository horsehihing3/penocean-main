package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.AuditInspectionCreateRequest;
import com.penocean.ehs.dto.response.AuditInspectionDetailResponse;
import com.penocean.ehs.dto.response.AuditInspectionListItem;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.AuditInspectionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/audit-inspections")
@RequiredArgsConstructor
@Tag(name = "AuditInspection", description = "감사점검 API")
public class AuditInspectionController {

    private final AuditInspectionService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "감사점검 목록")
    public ResponseEntity<ApiResponse<PageResponse<AuditInspectionListItem>>> list(
            @RequestParam(required = false) String inspectionType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.list(inspectionType, status, dateFrom, dateTo, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "감사점검 상세")
    public ResponseEntity<ApiResponse<AuditInspectionDetailResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.detail(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "감사점검 생성")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody AuditInspectionCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = service.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("등록되었습니다", Map.of("id", id)));
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "감사점검 상태 변경 (OPEN/CLOSED)")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.updateStatus(id, status, caller);
        return ResponseEntity.ok(ApiResponse.success("상태가 변경되었습니다", null));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
