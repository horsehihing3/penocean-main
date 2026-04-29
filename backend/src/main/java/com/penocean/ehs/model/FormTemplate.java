package com.penocean.ehs.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormTemplate {

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
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean deleted;
}
