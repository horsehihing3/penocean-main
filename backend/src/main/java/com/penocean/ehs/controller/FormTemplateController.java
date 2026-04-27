package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.FormTemplateCreateRequest;
import com.penocean.ehs.dto.response.FormTemplateResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.FileStorageService;
import com.penocean.ehs.service.FormTemplateService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/form-templates")
@RequiredArgsConstructor
@Tag(name = "FormTemplate", description = "양식함 API")
public class FormTemplateController {

    private final FormTemplateService service;
    private final FileStorageService fileStorageService;
    private final UserMapper userMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    @Operation(summary = "양식 목록")
    public ResponseEntity<ApiResponse<PageResponse<FormTemplateResponse>>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "true") boolean activeOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(service.list(category, keyword, activeOnly, page, size)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "양식 상세 (download count 증가)")
    public ResponseEntity<ApiResponse<FormTemplateResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.detail(id)));
    }

    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE})
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "양식 업로드 (multipart: file + meta)")
    public ResponseEntity<ApiResponse<Map<String, Long>>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestPart("meta") String metaJson,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        FormTemplateCreateRequest request;
        try {
            request = objectMapper.readValue(metaJson, FormTemplateCreateRequest.class);
        } catch (Exception e) {
            throw new BadRequestException("meta JSON 파싱 실패: " + e.getMessage());
        }
        FileStorageService.Stored stored = fileStorageService.save(file, "form-template");
        Long id = service.create(request, stored, caller);
        return ResponseEntity.ok(ApiResponse.success("등록되었습니다", Map.of("id", id)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "양식 삭제")
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
