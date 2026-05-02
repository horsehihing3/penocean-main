package com.penocean.ehs.controller;

// [2026-05-02] 비로그인 파일 업로드 — /public/upload/** (SecurityConfig에서 permitAll)
import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.dto.response.UploadTokenInfoResponse;
import com.penocean.ehs.service.AccessRequestService;
import com.penocean.ehs.service.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/public/upload")
@RequiredArgsConstructor
@Tag(name = "PublicUpload", description = "비로그인 파일 업로드 API")
public class PublicUploadController {

    private final AccessRequestService accessRequestService;
    private final FileStorageService fileStorageService;

    @GetMapping("/{token}")
    @Operation(summary = "토큰으로 신청 정보 조회 (비로그인)")
    public ResponseEntity<ApiResponse<UploadTokenInfoResponse>> getInfo(
            @PathVariable String token) {
        UploadTokenInfoResponse info = accessRequestService.getInfoByToken(token);
        return ResponseEntity.ok(ApiResponse.success(info));
    }

    @PostMapping("/{token}/files")
    @Operation(summary = "파일 업로드 (비로그인) — attachmentType: DAILY_SAFETY_LOG / WORK_PLAN / PLEDGE / OTHER")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadFile(
            @PathVariable String token,
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "OTHER") String attachmentType) {
        FileStorageService.Stored stored = fileStorageService.save(file, "public-upload");
        Long attachmentId = accessRequestService.uploadByToken(
                token, attachmentType,
                stored.originalName(), stored.relativePath(),
                stored.size(), stored.contentType());
        return ResponseEntity.ok(ApiResponse.success("업로드되었습니다",
                Map.of("id", attachmentId, "fileName", stored.originalName())));
    }
}
