package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.CompanyCreateRequest;
import com.penocean.ehs.dto.request.CompanyUpdateRequest;
import com.penocean.ehs.dto.response.CompanyListItem;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.Company;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.CompanyAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/companies")
@RequiredArgsConstructor
@Tag(name = "CompanyAdmin", description = "업체관리 API")
public class CompanyAdminController {

    private final CompanyAdminService service;
    private final UserMapper userMapper;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "업체 목록")
    public ResponseEntity<ApiResponse<PageResponse<CompanyListItem>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String industryCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                service.list(keyword, status, industryCode, page, size)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "업체 상세")
    public ResponseEntity<ApiResponse<Company>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.detail(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "업체 신규 등록 (관리자 직접 등록)")
    public ResponseEntity<ApiResponse<java.util.Map<String, Long>>> create(
            @RequestBody CompanyCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = service.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("등록되었습니다", java.util.Map.of("id", id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "업체 정보 수정")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody CompanyUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.update(id, request, caller);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @PostMapping("/{id}/inactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "업체 비활성화")
    public ResponseEntity<ApiResponse<Void>> inactivate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.inactivate(id, caller);
        return ResponseEntity.ok(ApiResponse.success("비활성화되었습니다", null));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
