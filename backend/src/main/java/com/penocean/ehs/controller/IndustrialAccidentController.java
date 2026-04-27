package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.IndustrialAccidentCreateRequest;
import com.penocean.ehs.dto.response.IndustrialAccidentDetailResponse;
import com.penocean.ehs.dto.response.IndustrialAccidentListItem;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.FileStorageService;
import com.penocean.ehs.service.IndustrialAccidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/industrial-accidents")
@RequiredArgsConstructor
@Tag(name = "IndustrialAccident", description = "산업재해 API")
public class IndustrialAccidentController {

    private final IndustrialAccidentService industrialAccidentService;
    private final FileStorageService fileStorageService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "산업재해 목록")
    public ResponseEntity<ApiResponse<PageResponse<IndustrialAccidentListItem>>> list(
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String businessNumber,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String accidentType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(industrialAccidentService.list(
                companyId, businessNumber, severity, accidentType, dateFrom, dateTo, page, size, caller)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "산업재해 상세")
    public ResponseEntity<ApiResponse<IndustrialAccidentDetailResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(industrialAccidentService.detail(id, caller)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT') or hasRole('CONTRACTOR')")
    @Operation(summary = "산업재해 등록")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody IndustrialAccidentCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = industrialAccidentService.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("산업재해가 등록되었습니다", Map.of("id", id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "산업재해 수정")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody IndustrialAccidentCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        industrialAccidentService.update(id, request, caller);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "산업재해 삭제")
    public ResponseEntity<ApiResponse<Void>> softDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        industrialAccidentService.softDelete(id, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    @PostMapping("/{id}/report")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT') or hasRole('CONTRACTOR')")
    @Operation(summary = "산업재해 보고서 파일 업로드 (CONTRACTOR 는 자사 건에 한해)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadReport(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        FileStorageService.Stored stored = fileStorageService.save(file, "industrial-accident");
        industrialAccidentService.uploadReport(id, stored.relativePath(), caller);
        return ResponseEntity.ok(ApiResponse.success("업로드되었습니다",
                Map.of("fileName", stored.originalName(),
                       "filePath", stored.relativePath(),
                       "fileSize", stored.size())));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
