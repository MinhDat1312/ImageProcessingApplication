package com.pipeline.image.controller;

import com.pipeline.image.common.FilterType;
import com.pipeline.image.core.ImagePipeline;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.entity.Image;
import com.pipeline.image.entity.User;
import com.pipeline.image.dto.request.ProcessRequestDto;
import com.pipeline.image.dto.response.ProcessResponseDto;
import com.pipeline.image.exception.InvalidException;
import com.pipeline.image.repository.ImageRepository;
import com.pipeline.image.repository.UserRepository;
import com.pipeline.image.service.StorageService;
import com.pipeline.image.stages.*;
import com.pipeline.image.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final StorageService storageService;

    @PostMapping("/process")
    public ResponseEntity<?> processImage(
            @RequestParam("file") MultipartFile file,
            @ModelAttribute ProcessRequestDto requestDto
    ) {

        try {
            log.info("Starting image processing - filename: {}, size: {}", file.getOriginalFilename(), file.getSize());

            User currentUser = this.currentUser();
            log.info("User authenticated: {}", currentUser.getEmail());

            PipelineContext context = new PipelineContext(file);
            context.setUserId(currentUser.getUserId());

            ImagePipeline pipeline = new ImagePipeline();

            pipeline.addStage(new InputStage());
            log.info("Added InputStage");

            if (requestDto.getResizeWidth() != null && requestDto.getResizeHeight() != null) {
                pipeline.addStage(new ResizeStage(requestDto.getResizeWidth(), requestDto.getResizeHeight()));
                log.info("Added ResizeStage: {}x{}", requestDto.getResizeWidth(), requestDto.getResizeHeight());
            }

            if (FilterType.grayscale.equals(requestDto.getFilterType()) ||
                    FilterType.sepia.equals(requestDto.getFilterType()) ||
                    FilterType.brightness.equals(requestDto.getFilterType())
            ) {
                float brightness = requestDto.getBrightnessLevel() != null ? requestDto.getBrightnessLevel() : 1.0f;
                pipeline.addStage(new FilterStage(requestDto.getFilterType(), brightness));
                log.info("Added FilterStage: {} brightness: {}", requestDto.getFilterType(), brightness);
            }

            if (requestDto.getWatermarkText() != null && !requestDto.getWatermarkText().trim().isEmpty()) {
                pipeline.addStage(new WatermarkStage(
                        requestDto.getWatermarkText(),
                        requestDto.getWatermarkPosition(),
                        requestDto.getWatermarkSize() != null ? requestDto.getWatermarkSize() : 30
                ));
                log.info("Added WatermarkStage: {}", requestDto.getWatermarkText());
            }

            if (requestDto.getCompressionQuality() != null) {
                pipeline.addStage(new CompressionStage(requestDto.getCompressionQuality()));
                log.info("Added CompressionStage: quality {}", requestDto.getCompressionQuality());
            }

            pipeline.addStage(new OutputStage(storageService));
            log.info("Added OutputStage, executing pipeline...");

            context = pipeline.execute(context);

            log.info("Pipeline executed - hasError: {}, errorMsg: {}, outputUrl: {}",
                    context.isHasError(), context.getErrorMessage(), context.getOutputUrl());

            if (context.isHasError()) {
                log.error("Pipeline error: {}", context.getErrorMessage());
                return ResponseEntity.badRequest().body(Map.of("error", context.getErrorMessage()));
            }

            if (context.getOutputUrl() == null || context.getOutputUrl().isBlank()) {
                log.error("No output URL generated");
                return ResponseEntity.internalServerError().body(Map.of("error", "Processed image URL was not generated"));
            }

            Image savedImage = new Image();
            savedImage.setUser(currentUser);
            savedImage.setUrl(context.getOutputUrl());
            Image persistedImage = this.imageRepository.save(savedImage);
            log.info("Image saved to DB: {}", persistedImage.getImageId());

            ProcessResponseDto response = ProcessResponseDto.builder()
                    .url(context.getOutputUrl())
                    .filename(context.getOutputFilename())
                    .executionTimeMs(context.getExecutionTimeMs())
                    .imageId(persistedImage.getImageId())
                    .build();
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to process image", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process image: " + e.getMessage()));
        }
    }

        @GetMapping("/me")
        public ResponseEntity<Map<String, Object>> myImages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size
        ) {
        try {
            User currentUser = currentUser();
            int normalizedPage = Math.max(page, 0);
            int normalizedSize = Math.min(Math.max(size, 1), 50);
            Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);

            Page<Image> imagePage = imageRepository.findByUser_UserIdOrderByCreatedAtDesc(currentUser.getUserId(), pageable);

            var items = imagePage.getContent()
                    .stream()
                    .map(image -> Map.<String, Object>of(
                            "id", image.getImageId(),
                            "url", image.getUrl(),
                            "createdAt", image.getCreatedAt()
                    ))
                    .toList();

            return ResponseEntity.ok(Map.of(
                "items", items,
                "page", imagePage.getNumber(),
                "size", imagePage.getSize(),
                "totalItems", imagePage.getTotalElements(),
                "totalPages", imagePage.getTotalPages()
            ));
        } catch (InvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
        }

    private User currentUser() throws InvalidException {
        String currentEmail = SecurityUtil.getCurrentUserEmail();
        return this.userRepository.findByEmailWithRole(currentEmail)
                .orElseThrow(() -> new InvalidException("User not found"));
    }
}

