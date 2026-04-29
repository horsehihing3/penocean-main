package com.penocean.ehs.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormTemplateCreateRequest {

    private String category;
    private String title;
    private String description;
    private String version;
    private Boolean active;
}
