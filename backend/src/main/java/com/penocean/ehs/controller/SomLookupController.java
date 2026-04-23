package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.response.SomCompanyLookupResponse;
import com.penocean.ehs.service.SomLookupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/som")
@RequiredArgsConstructor
@Tag(name = "SOM", description = "사업자번호 자동완성 (SOM 연동 stub)")
public class SomLookupController {

    private final SomLookupService service;

    @GetMapping("/lookup/{businessNumber}")
    @Operation(summary = "사업자번호로 업체 정보 조회")
    public ResponseEntity<ApiResponse<SomCompanyLookupResponse>> lookup(
            @PathVariable String businessNumber) {
        Optional<SomCompanyLookupResponse> result = service.lookupByBusinessNumber(businessNumber);
        return ResponseEntity.ok(ApiResponse.success(result.orElse(null)));
    }

    @GetMapping("/snapshots")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SOM 스냅샷 목록")
    public ResponseEntity<ApiResponse<PageResponse<SomCompanyLookupResponse>>> snapshots(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int p = Math.max(page, 0);
        int s = size <= 0 ? 20 : size;
        int offset = p * s;
        List<SomCompanyLookupResponse> content = service.listSnapshots(keyword, offset, s);
        long total = service.countSnapshots(keyword);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.of(content, total, p, s)));
    }

    @PostMapping("/snapshots")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SOM 스냅샷 수동 upsert")
    public ResponseEntity<ApiResponse<Void>> upsert(
            @RequestBody SomCompanyLookupResponse payload) {
        service.upsert(payload);
        return ResponseEntity.ok(ApiResponse.success("저장되었습니다", null));
    }
}
