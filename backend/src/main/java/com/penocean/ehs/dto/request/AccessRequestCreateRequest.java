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
    private List<WorkerItem> workers;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WorkerItem {
        private String workerName;
        private LocalDate workerBirth;
        private String workerPhone;
        private String workerRole;
        private Boolean safetyEduCompleted;
    }
}
