package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.dto.request.EvaluationItemReorderRequest;
import com.penocean.ehs.dto.request.EvaluationItemSaveRequest;
import com.penocean.ehs.dto.response.EvaluationItemResponse;
import com.penocean.ehs.service.EvaluationItemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/evaluation-items")
@RequiredArgsConstructor
@Tag(name = "EvaluationItem", description = "협력업체 평가 항목 마스터 API")
public class EvaluationItemController {

    private final EvaluationItemService service;

    @GetMapping
    @Operation(summary = "평가 항목 목록")
    public ResponseEntity<ApiResponse<List<EvaluationItemResponse>>> list(
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(ApiResponse.success(service.list(activeOnly)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "평가 항목 상세")
    public ResponseEntity<ApiResponse<EvaluationItemResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.get(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "평가 항목 신규")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody EvaluationItemSaveRequest request) {
        Long id = service.create(request);
        return ResponseEntity.ok(ApiResponse.success("항목이 추가되었습니다", Map.of("id", id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "평가 항목 수정")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody EvaluationItemSaveRequest request) {
        service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "평가 항목 소프트 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    @PostMapping("/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "평가 항목 정렬 변경")
    public ResponseEntity<ApiResponse<Void>> reorder(
            @RequestBody EvaluationItemReorderRequest request) {
        service.reorder(request);
        return ResponseEntity.ok(ApiResponse.success("정렬이 변경되었습니다", null));
    }
}
