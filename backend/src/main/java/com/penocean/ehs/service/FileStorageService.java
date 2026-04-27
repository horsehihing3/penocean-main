package com.penocean.ehs.service;

import com.penocean.ehs.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;

    /**
     * Persist the given multipart to {uploadDir}/{subDir}/{yyyyMM}/{uuid}_{originalName}.
     * Returns the stored relative path (suitable for file_path DB column / download URL).
     */
    public Stored save(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }
        String yyyyMM = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        String safeSubDir = subDir == null ? "misc" : subDir.replaceAll("[^A-Za-z0-9_\\-./]", "_");
        Path dir = Paths.get(uploadDir, safeSubDir, yyyyMM).toAbsolutePath().normalize();

        try {
            Files.createDirectories(dir);
            String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
            String sanitized = original.replaceAll("[\\\\/:*?\"<>|]", "_");
            String storedName = UUID.randomUUID().toString().replace("-", "") + "_" + sanitized;
            Path target = dir.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String relative = Paths.get(safeSubDir, yyyyMM, storedName).toString().replace('\\', '/');
            log.info("File stored: {} ({} bytes)", relative, file.getSize());
            return new Stored(original, relative, file.getSize(), file.getContentType());
        } catch (IOException e) {
            log.error("File storage failed", e);
            throw new RuntimeException("File storage failed: " + e.getMessage(), e);
        }
    }

    public record Stored(String originalName, String relativePath, long size, String contentType) {}
}
