package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.AccessRequestCreateRequest;
import com.penocean.ehs.dto.request.AccessRequestUpdateRequest;
import com.penocean.ehs.dto.request.AccessReviewRequest;
import com.penocean.ehs.dto.request.WorkerBulkUploadRequest;
import com.penocean.ehs.dto.response.AccessRequestDetailResponse;
import com.penocean.ehs.dto.response.AccessRequestListItem;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.AccessRequestService;
import com.penocean.ehs.service.FileStorageService;
import com.penocean.ehs.service.WorkerExcelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

import com.penocean.ehs.mapper.AccessAttachmentMapper;
import com.penocean.ehs.model.AccessAttachment;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/access-requests")
@RequiredArgsConstructor
@Tag(name = "AccessRequest", description = "사업장(선박) 출입신청 API")
public class AccessRequestController {

    private final AccessRequestService accessRequestService;
    private final FileStorageService fileStorageService;
    private final WorkerExcelService workerExcelService;
    private final UserMapper userMapper;
    private final AccessAttachmentMapper accessAttachmentMapper;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @GetMapping
    @Operation(summary = "출입신청 목록")
    public ResponseEntity<ApiResponse<PageResponse<AccessRequestListItem>>> list(
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
        PageResponse<AccessRequestListItem> result = accessRequestService.list(
                status, companyId, vesselId, keyword, dateFrom, dateTo, page, size, caller);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "출입신청 상세")
    public ResponseEntity<ApiResponse<AccessRequestDetailResponse>> detail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        AccessRequestDetailResponse detail = accessRequestService.detail(id, caller);
        return ResponseEntity.ok(ApiResponse.success(detail));
    }

    @PostMapping
    @PreAuthorize("hasRole('CONTRACTOR') or hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "출입신청 생성 (DRAFT)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> create(
            @RequestBody AccessRequestCreateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long id = accessRequestService.create(request, caller);
        return ResponseEntity.ok(ApiResponse.success("신청이 생성되었습니다", Map.of("id", id)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "출입신청 수정 (DRAFT/IMPROVEMENT_REQUESTED)")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody AccessRequestUpdateRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.update(id, request, caller);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @PostMapping("/{id}/clone")
    @PreAuthorize("hasRole('CONTRACTOR') or hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "신청서 재사용 (기존 신청서를 새 DRAFT로 복제, 교육이수 상태는 초기화)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> clone(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        Long newId = accessRequestService.clone(id, caller);
        return ResponseEntity.ok(ApiResponse.success("신청서가 복제되었습니다", Map.of("id", newId)));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "출입신청 제출 (DRAFT → SUBMITTED)")
    public ResponseEntity<ApiResponse<Void>> submit(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.submit(id, caller);
        return ResponseEntity.ok(ApiResponse.success("제출되었습니다", null));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "서류 검토 액션 (START/IMPROVEMENT/APPROVE/REJECT)")
    public ResponseEntity<ApiResponse<Void>> review(
            @PathVariable Long id,
            @RequestBody AccessReviewRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.review(id, request.getAction(), request.getComment(), caller);
        return ResponseEntity.ok(ApiResponse.success("검토 액션이 처리되었습니다", null));
    }

    @PostMapping("/{id}/workers")
    @Operation(summary = "작업자 추가 (bulk)")
    public ResponseEntity<ApiResponse<Void>> addWorkers(
            @PathVariable Long id,
            @RequestBody WorkerBulkUploadRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.addWorkers(id, request.getWorkers(), caller);
        return ResponseEntity.ok(ApiResponse.success("작업자가 추가되었습니다", null));
    }

    @PostMapping("/{id}/workers/excel")
    @Operation(summary = "작업자 엑셀 업로드 (bulk). PPT slide 14: 첫 행 헤더, 첫 데이터 행 = 승선대표자")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> uploadWorkerExcel(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        var workers = workerExcelService.parse(file);
        accessRequestService.addWorkers(id, workers, caller);
        return ResponseEntity.ok(ApiResponse.success(
                "엑셀에서 작업자 " + workers.size() + "명이 등록되었습니다",
                Map.of("imported", workers.size())));
    }

    @PostMapping("/workers/excel/parse")
    @Operation(summary = "엑셀 파싱(저장 없이). 작성 중 폼에 자동 채우기용")
    public ResponseEntity<ApiResponse<java.util.List<com.penocean.ehs.dto.request.AccessRequestCreateRequest.WorkerItem>>>
            parseWorkerExcel(@RequestPart("file") MultipartFile file) {
        return ResponseEntity.ok(ApiResponse.success(workerExcelService.parse(file)));
    }

    @GetMapping("/workers/excel-template")
    @Operation(summary = "작업자 엑셀 양식 다운로드")
    public ResponseEntity<byte[]> downloadWorkerExcelTemplate() {
        byte[] xlsx = workerExcelService.buildTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"access_workers_template.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(xlsx);
    }

    @DeleteMapping("/{id}/workers/{workerId}")
    @Operation(summary = "작업자 삭제")
    public ResponseEntity<ApiResponse<Void>> removeWorker(
            @PathVariable Long id,
            @PathVariable Long workerId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.removeWorker(id, workerId, caller);
        return ResponseEntity.ok(ApiResponse.success("작업자가 삭제되었습니다", null));
    }

    @PostMapping("/workers/{workerId}/edu")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "작업자 안전교육 이수 상태 갱신")
    public ResponseEntity<ApiResponse<Void>> updateEduStatus(
            @PathVariable Long workerId,
            @RequestParam boolean completed,
            @RequestParam(required = false) String certificateUrl,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.updateEduStatus(workerId, completed, certificateUrl, caller);
        return ResponseEntity.ok(ApiResponse.success("안전교육 상태가 갱신되었습니다", null));
    }

    @PostMapping("/workers/{workerId}/check-by-ship")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "방문허가서 작업자별 '선박 승선 체크' 토글 (PPT slide 15)")
    public ResponseEntity<ApiResponse<Void>> updateCheckByShip(
            @PathVariable Long workerId,
            @RequestParam boolean checked,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.updateCheckByShip(workerId, checked, caller);
        return ResponseEntity.ok(ApiResponse.success("선박 승선 체크가 갱신되었습니다", null));
    }

    @PostMapping("/{id}/attachments")
    @Operation(summary = "첨부파일 업로드")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadAttachment(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam("attachmentType") String attachmentType,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        FileStorageService.Stored stored = fileStorageService.save(file, "access");
        Long attachmentId = accessRequestService.addAttachment(
                id, attachmentType, stored.originalName(), stored.relativePath(),
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
    @Operation(summary = "첨부파일 삭제")
    public ResponseEntity<ApiResponse<Void>> deleteAttachment(
            @PathVariable Long id,
            @PathVariable Long attachmentId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.removeAttachment(id, attachmentId, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    // [2026-05-02] 첨부파일 다운로드
    @GetMapping("/{id}/attachments/{attachmentId}/download")
    @Operation(summary = "첨부파일 다운로드")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Long id,
            @PathVariable Long attachmentId) throws Exception {
        AccessAttachment att = accessAttachmentMapper.findById(attachmentId);
        if (att == null || !att.getAccessRequestId().equals(id)) {
            throw new ResourceNotFoundException("Attachment", "id", attachmentId);
        }
        Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(att.getFilePath()).normalize();
        Resource resource = new PathResource(filePath);
        if (!resource.exists()) throw new ResourceNotFoundException("File", "path", att.getFilePath());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(att.getFileName(), StandardCharsets.UTF_8)
                                .build().toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @PostMapping("/{id}/upload-token")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "비로그인 파일 업로드 토큰 생성 (30일 만료)")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateUploadToken(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        String token = accessRequestService.generateUploadToken(id, caller);
        return ResponseEntity.ok(ApiResponse.success("업로드 링크가 생성되었습니다", Map.of("token", token)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "출입신청 소프트 삭제 (DRAFT)")
    public ResponseEntity<ApiResponse<Void>> softDelete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        accessRequestService.softDelete(id, caller);
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
