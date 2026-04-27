package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.WorkerVoiceCreateRequest;
import com.penocean.ehs.dto.request.WorkerVoiceUpdateStatusRequest;
import com.penocean.ehs.dto.response.WorkerVoiceDetailResponse;
import com.penocean.ehs.dto.response.WorkerVoiceListItem;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.FileStorageService;
import com.penocean.ehs.service.WorkerVoiceService;
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
@RequestMapping("/worker-voices")
@RequiredArgsConstructor
@Tag(name = "WorkerVoice", description = "근로자 의견조회 API")
public class WorkerVoiceController {

    private final WorkerVoiceService workerVoiceService;
    private final FileStorageService fileStorageService;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "근로자 의견 목록")
    public ResponseEntity<ApiResponse<PageResponse<WorkerVoiceListItem>>> list(
            @RequestParam(required = false) String voiceType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) Long vesselId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(workerVoiceService.list(
                voiceType, status, companyId, vesselId, keyword, dateFrom, dateTo, page, size, caller)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "근로자 의견 상세")
    public ResponseEntity<ApiResponse<WorkerVoiceDetailResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(workerVoiceService.detail(id, caller)));
    }

    @PostMapping
    @Operation(summary = "근로자 의견 생성")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody WorkerVoiceCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = workerVoiceService.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("의견이 접수되었습니다", Map.of("id", id)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "상태 변경 (관리자/사업부)")
    public ResponseEntity<ApiResponse<Void>> updateStatus(
            @PathVariable Long id,
            @RequestBody WorkerVoiceUpdateStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        workerVoiceService.updateStatus(id, request, caller);
        return ResponseEntity.ok(ApiResponse.success("상태가 변경되었습니다", null));
    }

    @PostMapping("/{id}/attachments")
    @Operation(summary = "첨부 업로드")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadAttachment(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        FileStorageService.Stored stored = fileStorageService.save(file, "worker-voice");
        Long attachmentId = workerVoiceService.addAttachment(id,
                stored.originalName(), stored.relativePath(),
                stored.size(), stored.contentType(), caller);
        return ResponseEntity.ok(ApiResponse.success("업로드되었습니다",
                Map.of("id", attachmentId,
                       "fileName", stored.originalName(),
                       "filePath", stored.relativePath(),
                       "fileSize", stored.size())));
    }

    @DeleteMapping("/{id}/attachments/{aid}")
    @Operation(summary = "첨부 삭제")
    public ResponseEntity<ApiResponse<Void>> removeAttachment(
            @PathVariable Long id,
            @PathVariable Long aid,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        workerVoiceService.removeAttachment(id, aid, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "소프트 삭제 (관리자)")
    public ResponseEntity<ApiResponse<Void>> softDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        workerVoiceService.softDelete(id, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
