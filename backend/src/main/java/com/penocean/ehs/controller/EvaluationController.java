package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.EvaluationCreateRequest;
import com.penocean.ehs.dto.request.EvaluationReviewRequest;
import com.penocean.ehs.dto.request.EvaluationUpdateRequest;
import com.penocean.ehs.dto.response.EvaluationDetailResponse;
import com.penocean.ehs.dto.response.EvaluationListItem;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.EvaluationService;
import com.penocean.ehs.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/evaluations")
@RequiredArgsConstructor
@Tag(name = "Evaluation", description = "협력업체 평가 API")
public class EvaluationController {

    private final EvaluationService evaluationService;
    private final FileStorageService fileStorageService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "평가 목록")
    public ResponseEntity<ApiResponse<PageResponse<EvaluationListItem>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Integer periodYear,
            @RequestParam(required = false) String periodHalf,
            @RequestParam(required = false) String evaluationType,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        PageResponse<EvaluationListItem> result = evaluationService.list(
                status, companyId, periodYear, periodHalf, evaluationType, keyword, page, size, caller);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "평가 상세")
    public ResponseEntity<ApiResponse<EvaluationDetailResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(evaluationService.detail(id, caller)));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "평가 수정 이력 (PPT slide 26)")
    public ResponseEntity<ApiResponse<java.util.List<com.penocean.ehs.model.EvaluationHistory>>> history(
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(evaluationService.findHistory(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT') or hasRole('CONTRACTOR')")
    @Operation(summary = "평가 생성 (DRAFT)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody EvaluationCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = evaluationService.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("평가가 생성되었습니다", Map.of("id", id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "평가 수정")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody EvaluationUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        evaluationService.update(id, request, caller);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "평가 제출")
    public ResponseEntity<ApiResponse<Void>> submit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        evaluationService.submit(id, caller);
        return ResponseEntity.ok(ApiResponse.success("제출되었습니다", null));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "평가 검토 (APPROVE/REJECT)")
    public ResponseEntity<ApiResponse<Void>> review(
            @PathVariable Long id,
            @RequestBody EvaluationReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        evaluationService.review(id, request.getAction(), request.getReason(), caller);
        return ResponseEntity.ok(ApiResponse.success("검토가 처리되었습니다", null));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "평가 소프트 삭제 (DRAFT)")
    public ResponseEntity<ApiResponse<Void>> softDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        evaluationService.softDelete(id, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    @PostMapping("/{id}/attachments")
    @Operation(summary = "평가 첨부 업로드")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadAttachment(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "itemId", required = false) Long itemId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        FileStorageService.Stored stored = fileStorageService.save(file, "evaluation");
        Long attachmentId = evaluationService.addAttachment(
                id, itemId, stored.originalName(), stored.relativePath(),
                stored.size(), stored.contentType(), caller);
        return ResponseEntity.ok(ApiResponse.success("업로드되었습니다",
                Map.of(
                        "id", attachmentId,
                        "fileName", stored.originalName(),
                        "filePath", stored.relativePath(),
                        "fileSize", stored.size()
                )));
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    @Operation(summary = "평가 첨부 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        evaluationService.removeAttachment(id, attachmentId, caller);
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
