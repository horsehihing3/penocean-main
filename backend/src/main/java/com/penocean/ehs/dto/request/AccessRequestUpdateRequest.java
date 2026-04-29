package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessRequestUpdateRequest {

    private Long vesselId;
    private Long portId;
    private String workType;
    private String workDescription;
    private LocalDate plannedStartDate;
    private LocalDate plannedEndDate;
    // [2026-04-23] PPT 슬라이드 14: 안전담당자 정보
    private String safetyManagerName;
    private String safetyManagerTel;
    private String safetyManagerEmail;
    // [2026-04-29] 위험성평가표 없음 체크
    private Boolean noRiskAssessment;
    /** null이면 workers 변경 없음. 빈 리스트면 전체 삭제 후 재삽입. */
    private List<AccessRequestCreateRequest.WorkerItem> workers;
}
