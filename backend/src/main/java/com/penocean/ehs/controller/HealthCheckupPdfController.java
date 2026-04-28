// [2026-04-28] 건강검진 PDF 업로드 및 결과 조회 컨트롤러 — ADMIN 전용
package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.HealthCheckupResult;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.HealthCheckupPdfService;
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

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/health")
@RequiredArgsConstructor
@Tag(name = "HealthCheckupPdf", description = "건강검진 PDF 업로드 관리 API")
public class HealthCheckupPdfController {

    private final HealthCheckupPdfService service;
    private final UserMapper userMapper;

    @GetMapping("/results")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "건강검진 결과 목록 조회")
    public ResponseEntity<ApiResponse<List<HealthCheckupResult>>> list(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(ApiResponse.success(service.list(year, keyword)));
    }

    // [2026-04-28] 동일 성명 최근 3건 조회 — 3개년 비교 팝업용
    @GetMapping("/results/recent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "동일 성명 최근 3건 조회 (3개년 비교)")
    public ResponseEntity<ApiResponse<List<HealthCheckupResult>>> recent(
            @RequestParam String empName) {
        return ResponseEntity.ok(ApiResponse.success(service.recentByEmpName(empName, 3)));
    }

    // [2026-04-28] 다중 이미지 파싱 — Claude Vision API 사용. DB 저장 없이 반환.
    @PostMapping(value = "/upload-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "병원 앱 스크린샷(JPG/PNG) 파싱 — Claude Vision API. 여러 장 동시 업로드 가능")
    public ResponseEntity<ApiResponse<HealthCheckupResult>> uploadImages(
            @RequestPart("files") List<MultipartFile> files,
            @RequestParam(value = "hospitalName", required = false) String hospitalName,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        HealthCheckupResult result = service.parseImages(files, caller.getUsername());
        if (hospitalName != null && !hospitalName.isBlank()) {
            result.setHospitalName(hospitalName.trim());
        }
        return ResponseEntity.ok(ApiResponse.success("파싱 완료", result));
    }

    // [2026-04-28] 파싱만 수행 — DB 저장 없이 반환. 프론트에서 "DB 저장하기" 클릭 시 POST /results 로 저장.
    @PostMapping(value = "/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "건강검진 PDF 파싱 (저장 X). 비밀번호 보호 PDF는 password 파라미터 전달")
    public ResponseEntity<ApiResponse<HealthCheckupResult>> upload(
            @RequestPart("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "hospitalName", required = false) String hospitalName,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        HealthCheckupResult result = service.parseOnly(file, password, caller.getUsername());
        // [2026-04-28] 병원명 직접 입력 시 파싱값 덮어쓰기 (PDF 인코딩 한계 대응)
        if (hospitalName != null && !hospitalName.isBlank()) {
            result.setHospitalName(hospitalName.trim());
        }
        return ResponseEntity.ok(ApiResponse.success("파싱 완료", result));
    }

    // [2026-04-28] 파싱된 결과 DB 저장 — 프론트 "DB 저장하기" 버튼
    @PostMapping("/results")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "파싱된 건강검진 결과 DB 저장")
    public ResponseEntity<ApiResponse<HealthCheckupResult>> saveResult(
            @RequestBody HealthCheckupResult result,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        result.setId(null);
        result.setCreatedBy(caller.getUsername());
        return ResponseEntity.ok(ApiResponse.success("저장 완료", service.save(result)));
    }

    // [2026-04-28] 전체 필드 수정 — 수작업 편집 다이얼로그용
    @PutMapping("/results/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "건강검진 결과 전체 필드 수정")
    public ResponseEntity<ApiResponse<Void>> update(
            @PathVariable Long id,
            @RequestBody HealthCheckupResult result) {
        result.setId(id);
        service.updateAll(result);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다.", null));
    }

    @DeleteMapping("/results/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "건강검진 결과 삭제")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다.", null));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }

    private Boolean toBool(Object v) {
        if (v == null) return false;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(v.toString());
    }
}
