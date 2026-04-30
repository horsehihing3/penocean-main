package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.dto.response.ProcedureDocResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.ProcedureDoc;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.FileStorageService;
import com.penocean.ehs.service.ProcedureDocService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@RestController
@RequestMapping("/procedure-docs")
@RequiredArgsConstructor
@Tag(name = "ProcedureDoc", description = "절차서 등재·다운로드 API")
public class ProcedureDocController {

    private final ProcedureDocService service;
    private final FileStorageService fileStorageService;
    private final UserMapper userMapper;

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @GetMapping("/latest")
    @Operation(summary = "절차서 최신 1건 조회 (procType: ACCESS_SAFETY | RISK_ASSESSMENT)")
    public ResponseEntity<ApiResponse<ProcedureDocResponse>> latest(
            @RequestParam String procType) {
        ProcedureDocResponse doc = service.getLatest(procType);
        return ResponseEntity.ok(ApiResponse.success(doc));
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "절차서 등재 (ADMIN 전용, multipart: file + procType)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam("procType") String procType,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        FileStorageService.Stored stored = fileStorageService.save(file, "procedure-doc");
        Long id = service.upload(procType, stored, caller);
        return ResponseEntity.ok(ApiResponse.success("등록되었습니다", Map.of("id", id)));
    }

    @GetMapping("/{id}/download")
    @Operation(summary = "절차서 파일 다운로드")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        ProcedureDoc doc = service.getEntity(id);
        Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(doc.getFilePath()).normalize();
        Resource resource = new PathResource(filePath);
        if (!resource.exists()) throw new ResourceNotFoundException("File", "path", doc.getFilePath());
        String filename = doc.getFileName() == null ? filePath.getFileName().toString() : doc.getFileName();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(filename, StandardCharsets.UTF_8)
                                .build().toString())
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "절차서 삭제 (ADMIN 전용)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        service.delete(id, caller);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
