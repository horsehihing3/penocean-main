package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.SafetyPerformanceLandRequest;
import com.penocean.ehs.dto.response.SafetyPerformanceLandResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.SafetyPerformanceLandService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/safety-performance/land")
@RequiredArgsConstructor
@Tag(name = "SafetyPerformanceLand", description = "육상 안전보건실적 API")
public class SafetyPerformanceLandController {

    private final SafetyPerformanceLandService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "육상 안전보건실적 목록")
    public ResponseEntity<ApiResponse<PageResponse<SafetyPerformanceLandResponse>>> list(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(service.list(departmentId, year, month, page, size, caller)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "육상 안전보건실적 upsert (department+year+month UNIQUE)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> upsert(
            @RequestBody SafetyPerformanceLandRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = service.upsert(request, caller);
        return ResponseEntity.ok(ApiResponse.success("저장되었습니다", Map.of("id", id)));
    }

    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "엑셀 다운로드 (Phase 6에서 POI 적용, 현재 CSV stub)")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        byte[] body = service.exportExcel(year, month);
        String fileName = String.format("safety-performance-land-%s-%s.csv",
                year == null ? "all" : year, month == null ? "all" : month);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", fileName);
        return ResponseEntity.ok().headers(headers).body(body);
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
