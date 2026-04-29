package com.penocean.ehs.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormTemplateResponse {

    private Long id;
    private String category;
    private String title;
    private String description;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String mimeType;
    private String version;
    private Long downloadCount;
    private Long uploadedBy;
    private String uploaderName;
    private Boolean active;
    private LocalDateTime createdAt;
}
