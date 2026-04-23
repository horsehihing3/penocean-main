package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.EvaluationImprovementRequest;
import com.penocean.ehs.dto.request.EvaluationImprovementResponseRequest;
import com.penocean.ehs.dto.response.EvaluationImprovementResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.EvaluationImprovementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/evaluation-improvements")
@RequiredArgsConstructor
@Tag(name = "EvaluationImprovement", description = "협력업체 평가 개선요청 API")
public class EvaluationImprovementController {

    private final EvaluationImprovementService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "개선요청 목록")
    public ResponseEntity<ApiResponse<PageResponse<EvaluationImprovementResponse>>> list(
            @RequestParam(required = false) Long evaluationId,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        PageResponse<EvaluationImprovementResponse> result =
                service.list(evaluationId, status, page, size, caller);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "개선요청 생성 (ADMIN/CONTRACT_DEPT)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody EvaluationImprovementRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = service.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("개선요청이 등록되었습니다", Map.of("id", id)));
    }

    @PostMapping("/{id}/respond")
    @Operation(summary = "개선요청 응답 (CONTRACTOR)")
    public ResponseEntity<ApiResponse<Void>> respond(
            @PathVariable Long id,
            @RequestBody EvaluationImprovementResponseRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.respond(id, request, caller);
        return ResponseEntity.ok(ApiResponse.success("응답이 등록되었습니다", null));
    }

    @PostMapping("/{id}/close")
    @Operation(summary = "개선요청 종결")
    public ResponseEntity<ApiResponse<Void>> close(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.close(id, caller);
        return ResponseEntity.ok(ApiResponse.success("종결되었습니다", null));
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
