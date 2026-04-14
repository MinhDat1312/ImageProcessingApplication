package com.pipeline.image.controller;

import com.pipeline.image.core.ImagePipeline;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.dto.ProcessRequestDto;
import com.pipeline.image.exception.InvalidImageFormatException;
import com.pipeline.image.factory.ImageStageFactory;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "*")
public class ImageController {
    private static final byte[] JPEG_SIGNATURE = new byte[]{
            (byte) 0xFF, (byte) 0xD8, (byte) 0xFF
    };
    private static final byte[] PNG_SIGNATURE = new byte[]{
            (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    };
    private static final Set<String> SUPPORTED_CONTENT_TYPES = Set.of(
            MediaType.IMAGE_JPEG_VALUE,
            MediaType.IMAGE_PNG_VALUE
    );

    private final ImageStageFactory imageStageFactory;

    @Value("${app.image.storage.dir:processed-images}")
    private String storageDir;

    public ImageController(ImageStageFactory imageStageFactory) {
        this.imageStageFactory = imageStageFactory;
    }

    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processImage(
            @RequestParam("file") MultipartFile file,
            @Valid @ModelAttribute ProcessRequestDto requestDto) throws Exception {

        validateUploadedFile(file);

        // Create pipeline context
        PipelineContext context = new PipelineContext(file);

        // Build pipeline
        ImagePipeline pipeline = new ImagePipeline();

        // Input stage - validate and load image
        pipeline.addStage(imageStageFactory.createInputStage());

        // Processing stages - add only if requested
        if (requestDto.getResizeWidth() != null && requestDto.getResizeHeight() != null) {
            pipeline.addStage(imageStageFactory.createResizeStage(
                    requestDto.getResizeWidth(),
                    requestDto.getResizeHeight()
            ));
        }

        if ("grayscale".equalsIgnoreCase(requestDto.getFilterType()) ||
                "sepia".equalsIgnoreCase(requestDto.getFilterType()) ||
                "brightness".equalsIgnoreCase(requestDto.getFilterType())) {
            float brightness = requestDto.getBrightnessLevel() != null ? requestDto.getBrightnessLevel() : 1.0f;
            pipeline.addStage(imageStageFactory.createFilterStage(
                    requestDto.getFilterType(),
                    brightness
            ));
        }

        if (requestDto.getWatermarkText() != null && !requestDto.getWatermarkText().trim().isEmpty()) {
            pipeline.addStage(imageStageFactory.createWatermarkStage(
                    requestDto.getWatermarkText(),
                    requestDto.getWatermarkPosition(),
                    requestDto.getWatermarkSize() != null ? requestDto.getWatermarkSize() : 30
            ));
        }

        float quality = 1.0f;
        if (requestDto.getCompressionQuality() != null) {
            quality = requestDto.getCompressionQuality();
            pipeline.addStage(imageStageFactory.createCompressionStage(quality));
        }

        // Output stage - save and generate URL
        pipeline.addStage(imageStageFactory.createOutputStage(storageDir, String.valueOf(quality)));

        // Execute pipeline
        context = pipeline.execute(context);

        if (context.isHasError()) {
            throw toControllerException(context.getErrorMessage());
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("url", context.getOutputUrl());
        response.put("filename", context.getOutputFilename());
        response.put("executionTimeMs", context.getExecutionTimeMs());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> downloadImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(storageDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists()) {
                return ResponseEntity.ok()
                        .contentType(filename.endsWith(".png") ? MediaType.IMAGE_PNG : MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    private void validateUploadedFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please upload a non-empty JPEG or PNG image.");
        }

        String contentType = normalizeContentType(file.getContentType());
        if (contentType == null || !SUPPORTED_CONTENT_TYPES.contains(contentType)) {
            throw new InvalidImageFormatException(
                    "Invalid file type. Only JPEG and PNG images are allowed."
            );
        }

        String detectedContentType = detectContentTypeFromMagicBytes(file);
        if (detectedContentType == null) {
            throw new InvalidImageFormatException(
                    "Invalid file signature. The uploaded file is not a valid JPEG or PNG image."
            );
        }

        if (!contentType.equals(detectedContentType)) {
            throw new InvalidImageFormatException(
                    "File content does not match the declared MIME type."
            );
        }
    }

    private RuntimeException toControllerException(String errorMessage) {
        if (errorMessage == null || errorMessage.isBlank()) {
            return new IllegalStateException("Image processing failed unexpectedly.");
        }

        if (errorMessage.contains("Only JPEG and PNG") || errorMessage.contains("Invalid image file")) {
            return new InvalidImageFormatException(errorMessage);
        }

        if (errorMessage.contains("File is empty")) {
            return new IllegalArgumentException(errorMessage);
        }

        return new IllegalStateException(errorMessage);
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return null;
        }
        return contentType.toLowerCase(Locale.ROOT);
    }

    private String detectContentTypeFromMagicBytes(MultipartFile file) {
        try (InputStream inputStream = file.getInputStream()) {
            byte[] header = inputStream.readNBytes(PNG_SIGNATURE.length);

            if (startsWithSignature(header, PNG_SIGNATURE)) {
                return MediaType.IMAGE_PNG_VALUE;
            }

            if (startsWithSignature(header, JPEG_SIGNATURE)) {
                return MediaType.IMAGE_JPEG_VALUE;
            }

            return null;
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to inspect the uploaded file signature.", ex);
        }
    }

    private boolean startsWithSignature(byte[] header, byte[] signature) {
        if (header.length < signature.length) {
            return false;
        }

        for (int i = 0; i < signature.length; i++) {
            if (header[i] != signature[i]) {
                return false;
            }
        }

        return true;
    }
}

