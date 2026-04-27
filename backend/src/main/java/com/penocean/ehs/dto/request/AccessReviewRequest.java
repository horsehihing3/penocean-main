package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessReviewRequest {

    /** START / IMPROVEMENT / APPROVE / REJECT */
    private String action;
    private String comment;
}
