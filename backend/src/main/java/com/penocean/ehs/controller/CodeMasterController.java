package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.exception.BadRequestException;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.mapper.CodeMasterMapper;
import com.penocean.ehs.mapper.DepartmentMapper;
import com.penocean.ehs.model.CodeMaster;
import com.penocean.ehs.model.Department;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
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

/**
 * PPT slide 6-7 요구: 업종/계약팀 목록을 내부 직원(관리자)이 수정 가능하도록.
 * - GET 은 공개 (가입 페이지 드롭다운 등에서 사용)
 * - POST/PUT/DELETE 는 ADMIN 권한 필요
 */
@RestController
@RequestMapping("/code-masters")
@RequiredArgsConstructor
@Tag(name = "CodeMaster", description = "코드 마스터 (업종) & 부서(계약팀) 관리 API")
public class CodeMasterController {

    private final CodeMasterMapper codeMasterMapper;
    private final DepartmentMapper departmentMapper;

    // =========================
    // tb_code (group_code 단위)
    // =========================

    @GetMapping("/groups/{groupCode}")
    @Operation(summary = "그룹별 코드 목록 (active only 옵션)")
    public ResponseEntity<ApiResponse<List<CodeMaster>>> listByGroup(
            @PathVariable String groupCode,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        return ResponseEntity.ok(ApiResponse.success(
                codeMasterMapper.findByGroup(groupCode, activeOnly)));
    }

    @PostMapping("/groups/{groupCode}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "코드 생성")
    public ResponseEntity<ApiResponse<Map<String, Long>>> createCode(
            @PathVariable String groupCode,
            @RequestBody CodeMaster body) {
        if (body.getCode() == null || body.getCode().isBlank()
                || body.getName() == null || body.getName().isBlank()) {
            throw new BadRequestException("code 와 name 은 필수입니다.");
        }
        if (codeMasterMapper.findByGroupAndCode(groupCode, body.getCode()) != null) {
            throw new BadRequestException("이미 존재하는 코드입니다: " + body.getCode());
        }
        body.setGroupCode(groupCode);
        codeMasterMapper.insert(body);
        return ResponseEntity.ok(ApiResponse.success("생성되었습니다", Map.of("id", body.getId())));
    }

    @PutMapping("/codes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "코드 수정 (name / description / active / sortOrder)")
    public ResponseEntity<ApiResponse<Void>> updateCode(
            @PathVariable Long id,
            @RequestBody CodeMaster body) {
        CodeMaster existing = codeMasterMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("CodeMaster", "id", id);
        body.setId(id);
        if (body.getName() == null || body.getName().isBlank()) body.setName(existing.getName());
        codeMasterMapper.update(body);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @DeleteMapping("/codes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "코드 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> deleteCode(@PathVariable Long id) {
        codeMasterMapper.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }

    // =========================
    // tb_department (계약팀 등)
    // =========================

    @GetMapping("/departments")
    @Operation(summary = "부서(계약팀) 전체 목록")
    public ResponseEntity<ApiResponse<List<Department>>> listDepartments() {
        return ResponseEntity.ok(ApiResponse.success(departmentMapper.findAll()));
    }

    @PostMapping("/departments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "부서 생성")
    public ResponseEntity<ApiResponse<Map<String, Long>>> createDepartment(@RequestBody Department body) {
        if (body.getCode() == null || body.getCode().isBlank()
                || body.getName() == null || body.getName().isBlank()) {
            throw new BadRequestException("code 와 name 은 필수입니다.");
        }
        if (departmentMapper.findByCode(body.getCode()) != null) {
            throw new BadRequestException("이미 존재하는 부서 코드입니다: " + body.getCode());
        }
        departmentMapper.insert(body);
        return ResponseEntity.ok(ApiResponse.success("생성되었습니다", Map.of("id", body.getId())));
    }

    @PutMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "부서 수정")
    public ResponseEntity<ApiResponse<Void>> updateDepartment(
            @PathVariable Long id,
            @RequestBody Department body) {
        Department existing = departmentMapper.findById(id);
        if (existing == null) throw new ResourceNotFoundException("Department", "id", id);
        body.setId(id);
        if (body.getName() == null || body.getName().isBlank()) body.setName(existing.getName());
        departmentMapper.update(body);
        return ResponseEntity.ok(ApiResponse.success("수정되었습니다", null));
    }

    @DeleteMapping("/departments/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "부서 삭제 (soft)")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentMapper.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("삭제되었습니다", null));
    }
}
