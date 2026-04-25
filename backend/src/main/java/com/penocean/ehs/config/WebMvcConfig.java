package com.penocean.ehs.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    // [2026-04-25] setUseTrailingSlashMatch deprecated 제거 — Spring 6에서 trailing slash 매칭 기본 지원 종료

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");

        // [2026-04-25] 업로드 파일 정적 서빙 — /api/files/{relativePath} → {uploadDir}/
        String location = uploadDir.startsWith("./")
                ? "file:" + uploadDir + "/"
                : "file:///" + uploadDir + "/";
        registry.addResourceHandler("/files/**")
                .addResourceLocations(location);
    }
}
