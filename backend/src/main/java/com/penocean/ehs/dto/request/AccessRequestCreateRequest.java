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
public class AccessRequestCreateRequest {

    /** Optional. null이면 요청자의 소속 company 사용 */
    private Long companyId;
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
    private List<WorkerItem> workers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkerItem {
        private String workerName;
        /** [2026-04-28] YYMMDD 문자열 형식 (프론트 입력값 그대로 수신, 서비스에서 LocalDate 변환) */
        private String workerBirth;
        private String workerPhone;
        private String workerRole;
        private Boolean safetyEduCompleted;
        /** [2026-04-29] yyyy-MM-dd 형식. 값이 있으면 서비스에서 safetyEduCompleted=true 자동 설정 */
        private String safetyEduCompletedAt;
    }
}
