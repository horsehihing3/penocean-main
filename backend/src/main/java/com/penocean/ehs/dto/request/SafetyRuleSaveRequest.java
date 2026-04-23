package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SafetyRuleSaveRequest {

    private String industryCode;
    private String ruleNo;
    private String title;
    private String content;
    private String severity;
    private Integer sortOrder;
    private Boolean active;
}
