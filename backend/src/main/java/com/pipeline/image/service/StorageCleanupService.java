package com.pipeline.image.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Stream;

@Service
public class StorageCleanupService {
    private static final Logger log = LoggerFactory.getLogger(StorageCleanupService.class);
    private static final Duration MAX_FILE_AGE = Duration.ofHours(24);

    @Value("${storage.processed-images.path}")
    private String processedImagesPath;

    @Scheduled(cron = "0 0 1 * * ?")
    public void cleanupOldFiles() {
        log.info("Running scheduled cleanup for processed images...");

        Path storagePath = Paths.get(processedImagesPath);
        if (!Files.exists(storagePath)) {
            log.info("Cleanup skipped. Storage directory does not exist: {}", storagePath.toAbsolutePath());
            return;
        }

        Instant cutoffTime = Instant.now().minus(MAX_FILE_AGE);
        AtomicInteger deletedFiles = new AtomicInteger();

        try (Stream<Path> files = Files.walk(storagePath)) {
            files.filter(Files::isRegularFile).forEach(file -> {
                try {
                    FileTime lastModifiedTime = Files.getLastModifiedTime(file);
                    if (lastModifiedTime.toInstant().isBefore(cutoffTime)) {
                        Files.delete(file);
                        deletedFiles.incrementAndGet();
                        log.info("Deleted old file: {}", file.getFileName());
                    }
                } catch (IOException ex) {
                    log.warn("Failed to process file during cleanup: {}", file, ex);
                }
            });
        } catch (IOException ex) {
            log.error("Scheduled cleanup failed for directory: {}", storagePath.toAbsolutePath(), ex);
            return;
        }

        log.info("Cleanup finished. Deleted {} files.", deletedFiles.get());
    }
}
