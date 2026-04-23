package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.dto.request.SafetyRuleSaveRequest;
import com.penocean.ehs.dto.response.SafetyRuleResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.SafetyRuleService;
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
@RequestMapping("/safety-rules")
@RequiredArgsConstructor
@Tag(name = "SafetyRule", description = "업종별 안전수칙 API")
public class SafetyRuleController {

    private final SafetyRuleService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "안전수칙 목록")
    public ResponseEntity<ApiResponse<List<SafetyRuleResponse>>> list(
            @RequestParam(required = false) String industryCode,
            @RequestParam(defaultValue = "true") boolean activeOnly) {
        return ResponseEntity.ok(ApiResponse.success(service.list(industryCode, activeOnly)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "안전수칙 생성")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody SafetyRuleSaveRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = service.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("등록되었습니다", Map.of("id", id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "안전수칙 수정")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody SafetyRuleSaveRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.update(id, request, caller);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @PostMapping("/{id}/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "안전수칙 정렬순서 변경")
    public ResponseEntity<ApiResponse<Void>> reorder(
            @PathVariable Long id,
            @RequestParam Integer sortOrder,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.reorder(id, sortOrder, caller);
        return ResponseEntity.ok(ApiResponse.success("정렬되었습니다", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "안전수칙 삭제")
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
