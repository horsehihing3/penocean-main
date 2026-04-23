package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.HealthCheckupCreateRequest;
import com.penocean.ehs.dto.request.HealthVitalInput;
import com.penocean.ehs.dto.response.HealthCheckupDetailResponse;
import com.penocean.ehs.dto.response.HealthCheckupListItem;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.FileStorageService;
import com.penocean.ehs.service.HealthCheckupService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/health/checkups")
@RequiredArgsConstructor
@Tag(name = "HealthCheckup", description = "건강검진 API")
public class HealthCheckupController {

    private final HealthCheckupService service;
    private final FileStorageService fileStorageService;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    @Operation(summary = "건강검진 목록")
    public ResponseEntity<ApiResponse<PageResponse<HealthCheckupListItem>>> list(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String checkupType,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(
                service.list(userId, companyId, checkupType, dateFrom, dateTo, page, size, caller)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "건강검진 상세")
    public ResponseEntity<ApiResponse<HealthCheckupDetailResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(service.detail(id, caller)));
    }

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE})
    @Operation(summary = "건강검진 생성 (JSON)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody HealthCheckupCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = service.create(request, null, caller);
        return ResponseEntity.ok(ApiResponse.success("생성되었습니다", Map.of("id", id)));
    }

    @PostMapping(value = "/upload", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @Operation(summary = "건강검진 생성 (파일 업로드 + 메타)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createWithFile(
            @RequestPart("file") MultipartFile file,
            @RequestPart("meta") String metaJson,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        HealthCheckupCreateRequest request;
        try {
            request = objectMapper.readValue(metaJson, HealthCheckupCreateRequest.class);
        } catch (Exception e) {
            throw new BadRequestException("meta JSON 파싱 실패: " + e.getMessage());
        }
        FileStorageService.Stored stored = fileStorageService.save(file, "health");
        Long id = service.create(request, stored.relativePath(), caller);
        return ResponseEntity.ok(ApiResponse.success("생성되었습니다",
                Map.of("id", id, "filePath", stored.relativePath())));
    }

    @PostMapping("/{id}/vitals")
    @Operation(summary = "건강검진 추가 수치 입력")
    public ResponseEntity<ApiResponse<Map<String, Long>>> addVital(
            @PathVariable Long id,
            @RequestBody HealthVitalInput input,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long vid = service.addVital(id, input, caller);
        return ResponseEntity.ok(ApiResponse.success("추가되었습니다", Map.of("id", vid)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "건강검진 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.softDelete(id, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
