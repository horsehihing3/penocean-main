package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.DailySafetyLogCreateRequest;
import com.penocean.ehs.dto.response.DailySafetyLogResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.DailySafetyLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/daily-safety-logs")
@RequiredArgsConstructor
@Tag(name = "DailySafetyLog", description = "승선대표자 일일안전교육일지 API")
public class DailySafetyLogController {

    private final DailySafetyLogService dailySafetyLogService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "일일안전교육일지 목록")
    public ResponseEntity<ApiResponse<PageResponse<DailySafetyLogResponse>>> list(
            @RequestParam(required = false) Long vesselId,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        PageResponse<DailySafetyLogResponse> result =
                dailySafetyLogService.list(vesselId, companyId, dateFrom, dateTo, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "일일안전교육일지 상세")
    public ResponseEntity<ApiResponse<DailySafetyLogResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dailySafetyLogService.detail(id)));
    }

    @PostMapping
    @Operation(summary = "일일안전교육일지 등록")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody DailySafetyLogCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = dailySafetyLogService.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("등록되었습니다", Map.of("id", id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "일일안전교육일지 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        dailySafetyLogService.delete(id, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
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
