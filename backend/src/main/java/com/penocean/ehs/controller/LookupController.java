package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.mapper.PortMapper;
import com.penocean.ehs.mapper.VesselMapper;
import com.penocean.ehs.model.Port;
import com.penocean.ehs.model.Vessel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 드롭다운용 참조 데이터 조회. 출입신청 생성 등에서 선박/항구/업체 ID 를
 * 직접 알기 어렵기 때문에 관리 UI 에서 바로 Select 로 사용.
 */
@RestController
@RequestMapping("/lookup")
@RequiredArgsConstructor
@Tag(name = "Lookup", description = "드롭다운 참조 데이터")
public class LookupController {

    private final VesselMapper vesselMapper;
    private final PortMapper portMapper;

    @GetMapping("/vessels")
    @Operation(summary = "선박 전체 목록 (출입신청 등에서 드롭다운 선택용)")
    public ResponseEntity<ApiResponse<List<Vessel>>> vessels() {
        return ResponseEntity.ok(ApiResponse.success(vesselMapper.findAll()));
    }

    @GetMapping("/ports")
    @Operation(summary = "항구 전체 목록 (출입신청 등에서 드롭다운 선택용)")
    public ResponseEntity<ApiResponse<List<Port>>> ports() {
        return ResponseEntity.ok(ApiResponse.success(portMapper.findAll()));
    }
}
