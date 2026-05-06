package com.pipeline.image.controller;

import com.pipeline.image.core.ImagePipeline;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.entity.Image;
import com.pipeline.image.entity.User;
import com.pipeline.image.dto.request.ProcessRequestDto;
import com.pipeline.image.repository.ImageRepository;
import com.pipeline.image.repository.UserRepository;
import com.pipeline.image.service.S3StorageService;
import com.pipeline.image.stages.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
public class ImageController {

    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final S3StorageService storageService;

    public ImageController(UserRepository userRepository,
                           ImageRepository imageRepository,
                           S3StorageService storageService) {
        this.userRepository = userRepository;
        this.imageRepository = imageRepository;
        this.storageService = storageService;
    }

    @PostMapping("/process")
    public ResponseEntity<?> processImage(
            @RequestParam("file") MultipartFile file,
            @ModelAttribute ProcessRequestDto requestDto,
            Authentication authentication) {
        
        try {
            User currentUser = currentUser(authentication);

            // Create pipeline context
            PipelineContext context = new PipelineContext(file);
            context.setUserId(currentUser.getId());
            
            // Build pipeline
            ImagePipeline pipeline = new ImagePipeline();
            
            // Input stage - validate and load image
            pipeline.addStage(new InputStage());
            
            // Processing stages - add only if requested
            if (requestDto.getResizeWidth() != null && requestDto.getResizeHeight() != null) {
                pipeline.addStage(new ResizeStage(requestDto.getResizeWidth(), requestDto.getResizeHeight()));
            }
            
            if ("grayscale".equalsIgnoreCase(requestDto.getFilterType()) ||
                "sepia".equalsIgnoreCase(requestDto.getFilterType()) ||
                "brightness".equalsIgnoreCase(requestDto.getFilterType())) {
                float brightness = requestDto.getBrightnessLevel() != null ? requestDto.getBrightnessLevel() : 1.0f;
                pipeline.addStage(new FilterStage(requestDto.getFilterType(), brightness));
            }
            
            if (requestDto.getWatermarkText() != null && !requestDto.getWatermarkText().trim().isEmpty()) {
                pipeline.addStage(new WatermarkStage(
                        requestDto.getWatermarkText(),
                        requestDto.getWatermarkPosition(),
                        requestDto.getWatermarkSize() != null ? requestDto.getWatermarkSize() : 30
                ));
            }
            
            float quality = 1.0f;
            if (requestDto.getCompressionQuality() != null) {
                quality = requestDto.getCompressionQuality();
                pipeline.addStage(new CompressionStage(quality));
            }
            
            // Output stage - save and generate URL
            pipeline.addStage(new OutputStage(storageService));
            
            // Execute pipeline
            context = pipeline.execute(context);
            
            // Check for errors
            if (context.isHasError()) {
                return ResponseEntity.badRequest().body(Map.of("error", context.getErrorMessage()));
            }

            Image savedImage = new Image();
            savedImage.setUser(currentUser);
            savedImage.setImageUrl(context.getOutputUrl());
            savedImage = imageRepository.save(savedImage);
            
            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("url", context.getOutputUrl());
            response.put("filename", context.getOutputFilename());
            response.put("executionTimeMs", context.getExecutionTimeMs());
            response.put("imageId", savedImage.getId());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process image: " + e.getMessage()));
        }
    }

        @GetMapping("/mine")
        public ResponseEntity<Map<String, Object>> myImages(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        User currentUser = currentUser(authentication);
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);

        Page<Image> imagePage = imageRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId(), pageable);

        var items = imagePage.getContent()
                .stream()
                .map(image -> Map.<String, Object>of(
                        "id", image.getId(),
                        "url", image.getImageUrl(),
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
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteImage(@PathVariable Long id, Authentication authentication) {
        User currentUser = currentUser(authentication);
        Image image = imageRepository.findByIdAndUserId(id, currentUser.getId())
            .orElseThrow(() -> new IllegalArgumentException("Image not found"));

        storageService.deleteByUrl(image.getImageUrl());
        imageRepository.delete(image);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Map<String, String>> downloadImage(@PathVariable Long id, Authentication authentication) {
        User currentUser = currentUser(authentication);
        Image image = imageRepository.findByIdAndUserId(id, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));
        return ResponseEntity.ok(Map.of("url", image.getImageUrl()));
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new IllegalArgumentException("Authenticated user required");
        }

        return userRepository.findByUsernameIgnoreCase(authentication.getName())
                .or(() -> userRepository.findByEmailIgnoreCase(authentication.getName()))
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found"));
    }
}

