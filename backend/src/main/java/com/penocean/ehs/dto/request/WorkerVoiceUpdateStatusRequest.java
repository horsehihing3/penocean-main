package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkerVoiceUpdateStatusRequest {

    private String status;          // SUBMITTED / TRIAGED / IN_PROGRESS / RESOLVED / CLOSED
    private Long assignedTo;
    private String resolution;
}
