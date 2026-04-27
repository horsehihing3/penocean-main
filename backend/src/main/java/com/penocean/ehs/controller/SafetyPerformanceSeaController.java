package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.SafetyPerformanceSeaRequest;
import com.penocean.ehs.dto.response.SafetyPerformanceSeaResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.SafetyPerformanceSeaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/safety-performance/sea")
@RequiredArgsConstructor
@Tag(name = "SafetyPerformanceSea", description = "해상 안전보건실적 API")
public class SafetyPerformanceSeaController {

    private final SafetyPerformanceSeaService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "해상 안전보건실적 목록")
    public ResponseEntity<ApiResponse<PageResponse<SafetyPerformanceSeaResponse>>> list(
            @RequestParam(required = false) Long vesselId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(service.list(vesselId, year, month, page, size, caller)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "해상 안전보건실적 upsert (vessel+year+month UNIQUE)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> upsert(
            @RequestBody SafetyPerformanceSeaRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = service.upsert(request, caller);
        return ResponseEntity.ok(ApiResponse.success("저장되었습니다", Map.of("id", id)));
    }

    @PostMapping("/import")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "POS-SM 엑셀 업로드 (Phase 6에서 POI 파싱, 현재 uploadId 발급 stub)")
    public ResponseEntity<ApiResponse<Map<String, String>>> importExcel(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        String uploadId = service.importExcel(file, caller);
        return ResponseEntity.ok(ApiResponse.success("업로드되었습니다",
                Map.of("excelUploadId", uploadId)));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
