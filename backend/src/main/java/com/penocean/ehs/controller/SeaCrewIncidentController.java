package com.penocean.ehs.controller;

import com.penocean.ehs.common.ApiResponse;
import com.penocean.ehs.common.PageResponse;
import com.penocean.ehs.dto.request.SeaCrewIncidentBulkRequest;
import com.penocean.ehs.dto.response.SeaCrewIncidentResponse;
import com.penocean.ehs.exception.ResourceNotFoundException;
import com.penocean.ehs.exception.UnauthorizedException;
import com.penocean.ehs.mapper.UserMapper;
import com.penocean.ehs.model.User;
import com.penocean.ehs.service.SeaCrewIncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/sea-crew-incidents")
@RequiredArgsConstructor
@Tag(name = "SeaCrewIncident", description = "해상 선원 사고/질병 API")
public class SeaCrewIncidentController {

    private final SeaCrewIncidentService service;
    private final UserMapper userMapper;

    @GetMapping
    @Operation(summary = "해상 선원 사고/질병 목록")
    public ResponseEntity<ApiResponse<PageResponse<SeaCrewIncidentResponse>>> list(
            @RequestParam(required = false) Long vesselId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String incidentType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        return ResponseEntity.ok(ApiResponse.success(service.list(
                vesselId, year, month, incidentType, page, size, caller)));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTRACT_DEPT')")
    @Operation(summary = "선원 사고/질병 일괄 등록 (엑셀 업로드 연동)")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> bulkInsert(
            @RequestBody SeaCrewIncidentBulkRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User caller = resolveUser(userDetails);
        int count = service.bulkInsert(request, caller);
        return ResponseEntity.ok(ApiResponse.success("등록되었습니다", Map.of("inserted", count)));
    }

    private User resolveUser(UserDetails userDetails) {
        if (userDetails == null) throw new UnauthorizedException("Not authenticated");
        User u = userMapper.findByUsername(userDetails.getUsername());
        if (u == null) throw new ResourceNotFoundException("User", "username", userDetails.getUsername());
        return u;
    }
}
