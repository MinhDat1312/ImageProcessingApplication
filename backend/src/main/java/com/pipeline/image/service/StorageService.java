package com.pipeline.image.service;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.*;
import com.pipeline.image.dto.response.StorageResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
@RequiredArgsConstructor
public class StorageService {
    private final AmazonS3 s3Client;

    @Value("${application.bucket.name}")
    private String bucketName;

    @Async
    public CompletableFuture<StorageResponse> handleUploadFile(MultipartFile file, String folder) {
        String extension = FilenameUtils.getExtension(file.getOriginalFilename());
        String key = String.format(
                "prod/%s/%s.%s",
                folder,
                UUID.randomUUID(),
                extension
        );

        ObjectMetadata metadata = new ObjectMetadata();
        metadata.setContentLength(file.getSize());
        metadata.setContentType(file.getContentType());

        try (InputStream is = file.getInputStream()) {

            PutObjectRequest request = new PutObjectRequest(
                    this.bucketName,
                    key,
                    is,
                    metadata
            );
            this.s3Client.putObject(request);

        } catch (IOException e) {
            log.error("Upload to S3 failed:", e);
        }

        String url = this.s3Client.getUrl(bucketName, key).toString();

        return CompletableFuture.completedFuture(
                StorageResponse.builder()
                        .publicId(key)
                        .url(url)
                        .build()
        );
    }

    public S3ObjectInputStream handleDownloadFile(String key) {
        S3Object s3Object = this.s3Client.getObject(bucketName, key);
        return s3Object.getObjectContent();
    }

    public void handleDeleteFile(String key) {
        this.s3Client.deleteObject(bucketName, key);
    }

    private String generatePresignedUrl(String key, int minutes) {
        Date expiration = Date.from(
                Instant.now().plus(minutes, ChronoUnit.MINUTES)
        );

        GeneratePresignedUrlRequest request =
                new GeneratePresignedUrlRequest(this.bucketName, key)
                        .withMethod(HttpMethod.GET)
                        .withExpiration(expiration);

        return this.s3Client.generatePresignedUrl(request).toString();
    }
}
