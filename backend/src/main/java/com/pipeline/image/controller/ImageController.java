package com.pipeline.image.controller;

import com.pipeline.image.common.FilterType;
import com.pipeline.image.core.ImagePipeline;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.entity.Image;
import com.pipeline.image.entity.ImageVersion;
import com.pipeline.image.entity.User;
import com.pipeline.image.dto.request.ProcessRequestDto;
import com.pipeline.image.dto.request.ImageMetadataRequestDto;
import com.pipeline.image.dto.response.ProcessResponseDto;
import com.pipeline.image.exception.InvalidException;
import com.pipeline.image.repository.ImageRepository;
import com.pipeline.image.repository.UserRepository;
import com.pipeline.image.repository.ImageVersionRepository;
import com.pipeline.image.service.StorageService;
import com.pipeline.image.stages.*;
import com.pipeline.image.util.SecurityUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Optional;
import java.util.List;
import com.pipeline.image.repository.ImageLikeRepository;
import com.pipeline.image.repository.ImageCommentRepository;
import com.pipeline.image.repository.ImageSaveRepository;
import com.pipeline.image.dto.request.CommentRequestDto;
import com.pipeline.image.common.Visibility;
import com.pipeline.image.dto.response.ImageFeedItem;
import com.pipeline.image.service.ImageService;
import com.pipeline.image.service.AssistantService;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
@Slf4j
public class ImageController {

    private final UserRepository userRepository;
    private final ImageRepository imageRepository;
    private final StorageService storageService;
    private final ImageLikeRepository imageLikeRepository;
    private final ImageCommentRepository imageCommentRepository;
    private final ImageSaveRepository imageSaveRepository;
    private final ImageService imageService;
    private final ImageVersionRepository imageVersionRepository;
    private final ObjectMapper objectMapper;
    private final HttpServletRequest httpServletRequest;
    private final AssistantService assistantService;

    @PostMapping("/process")
    public ResponseEntity<?> processImage(
            @RequestParam("file") MultipartFile file,
            @ModelAttribute ProcessRequestDto requestDto
    ) {

        try {
            log.info("Starting image processing - filename: {}, size: {}", file.getOriginalFilename(), file.getSize());

            User currentUser = this.currentUser();
            log.info("User authenticated: {}", currentUser.getEmail());

            // 1. Upload original file to S3 first for version tracking
            log.info("Uploading original file to S3...");
            var originalUpload = storageService.handleUploadFile(file, currentUser.getUserId()).join();
            String originalUrl = originalUpload.getUrl();
            log.info("Original file uploaded to S3: {}", originalUrl);

            // 2. Load the input image to get original dimensions before processing
            PipelineContext context = new PipelineContext(file);
            context.setUserId(currentUser.getUserId());

            InputStage inputStage = new InputStage();
            context = inputStage.process(context);
            if (context.isHasError()) {
                log.error("Input stage error: {}", context.getErrorMessage());
                return ResponseEntity.badRequest().body(Map.of("error", context.getErrorMessage()));
            }

            int origWidth = context.getImage() != null ? context.getImage().getWidth() : 0;
            int origHeight = context.getImage() != null ? context.getImage().getHeight() : 0;

            // 3. Build and execute processing pipeline
            ImagePipeline pipeline = new ImagePipeline();

            // Crop
            if (requestDto.getCropX() != null && requestDto.getCropY() != null &&
                    requestDto.getCropWidth() != null && requestDto.getCropHeight() != null) {
                pipeline.addStage(new CropStage(
                        requestDto.getCropX(),
                        requestDto.getCropY(),
                        requestDto.getCropWidth(),
                        requestDto.getCropHeight()
                ));
                log.info("Added CropStage: x={}, y={}, w={}, h={}",
                        requestDto.getCropX(), requestDto.getCropY(), requestDto.getCropWidth(), requestDto.getCropHeight());
            }

            // Rotate
            if (requestDto.getRotateAngle() != null) {
                pipeline.addStage(new RotateStage(requestDto.getRotateAngle()));
                log.info("Added RotateStage: {} degrees", requestDto.getRotateAngle());
            }

            // Resize
            if (requestDto.getResizeWidth() != null && requestDto.getResizeHeight() != null) {
                pipeline.addStage(new ResizeStage(requestDto.getResizeWidth(), requestDto.getResizeHeight()));
                log.info("Added ResizeStage: {}x{}", requestDto.getResizeWidth(), requestDto.getResizeHeight());
            }

            // Filter (Grayscale, Sepia, Brightness, Contrast, Blur, Sharpen)
            if (requestDto.getFilterType() != null && !FilterType.none.equals(requestDto.getFilterType())) {
                float brightness = requestDto.getBrightnessLevel() != null ? requestDto.getBrightnessLevel() : 1.0f;
                float contrast = requestDto.getContrastLevel() != null ? requestDto.getContrastLevel() : 1.0f;
                pipeline.addStage(new FilterStage(requestDto.getFilterType(), brightness, contrast));
                log.info("Added FilterStage: {}, brightness={}, contrast={}", requestDto.getFilterType(), brightness, contrast);
            }

            // Watermark
            if (requestDto.getWatermarkText() != null && !requestDto.getWatermarkText().trim().isEmpty()) {
                pipeline.addStage(new WatermarkStage(
                        requestDto.getWatermarkText(),
                        requestDto.getWatermarkPosition(),
                        requestDto.getWatermarkSize() != null ? requestDto.getWatermarkSize() : 30
                ));
                log.info("Added WatermarkStage: {}", requestDto.getWatermarkText());
            }

            // Compression
            if (requestDto.getCompressionQuality() != null) {
                pipeline.addStage(new CompressionStage(requestDto.getCompressionQuality()));
                log.info("Added CompressionStage: quality {}", requestDto.getCompressionQuality());
            }

            // Output S3 Upload
            pipeline.addStage(new OutputStage(storageService));
            log.info("Executing processing pipeline...");

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

            // 4. Save Main Image Metadata
            Image savedImage = new Image();
            savedImage.setUser(currentUser);
            savedImage.setUrl(context.getOutputUrl());
            savedImage.setWidth(context.getImage() != null ? context.getImage().getWidth() : 0);
            savedImage.setHeight(context.getImage() != null ? context.getImage().getHeight() : 0);
            
            String title = requestDto.getTitle() != null && !requestDto.getTitle().isBlank() ? requestDto.getTitle() : file.getOriginalFilename();
            savedImage.setTitle(title);
            
            // Image processing does not have a prompt
            savedImage.setPrompt(null);
            
            // Generate description and tags using AI
            StringBuilder detailsBuilder = new StringBuilder();
            if (requestDto.getCropX() != null) {
                detailsBuilder.append("Cropped. ");
            }
            if (requestDto.getRotateAngle() != null && requestDto.getRotateAngle() != 0) {
                detailsBuilder.append("Rotated ").append(requestDto.getRotateAngle()).append(" degrees. ");
            }
            if (requestDto.getResizeWidth() != null) {
                detailsBuilder.append("Resized to ").append(requestDto.getResizeWidth()).append("x").append(requestDto.getResizeHeight()).append(". ");
            }
            if (requestDto.getFilterType() != null && !FilterType.none.equals(requestDto.getFilterType())) {
                detailsBuilder.append("Applied filter: ").append(requestDto.getFilterType().name()).append(". ");
            }
            if (requestDto.getWatermarkText() != null && !requestDto.getWatermarkText().trim().isEmpty()) {
                detailsBuilder.append("Added watermark '").append(requestDto.getWatermarkText()).append("'. ");
            }
            if (requestDto.getCompressionQuality() != null) {
                detailsBuilder.append("Compressed quality to ").append((int)(requestDto.getCompressionQuality() * 100)).append("%. ");
            }
            String details = detailsBuilder.toString().trim();
            if (details.isEmpty()) {
                details = "Uploaded original image.";
            }

            try {
                AssistantService.ImageAiMetadata aiMetadata = assistantService.generateAiMetadata(title, details, false);
                savedImage.setDescription(aiMetadata.getDescription());
                savedImage.setTags(aiMetadata.getTags());
            } catch (Exception ex) {
                log.warn("Failed to generate AI metadata for processed image, using fallback", ex);
                savedImage.setDescription("Processed image: " + title);
                savedImage.setTags("processed, edit");
            }

            savedImage.setThumbnailUrl(requestDto.getThumbnailUrl());
            savedImage.setVisibility(requestDto.getVisibility() != null ? requestDto.getVisibility() : Visibility.PUBLIC);
            Image persistedImage = this.imageRepository.save(savedImage);
            log.info("Image saved to DB: {}", persistedImage.getImageId());

            // 5. Save ORIGINAL and PROCESSED versions in DB
            ImageVersion originalVersion = new ImageVersion();
            originalVersion.setImage(persistedImage);
            originalVersion.setVersionNumber(1);
            originalVersion.setUrl(originalUrl);
            originalVersion.setWidth(origWidth);
            originalVersion.setHeight(origHeight);
            originalVersion.setFileSize(file.getSize());
            originalVersion.setVersionType("ORIGINAL");
            originalVersion.setPipelineStepsJson("[]");
            imageVersionRepository.save(originalVersion);
            log.info("Saved original version tracking record");

            ImageVersion processedVersion = new ImageVersion();
            processedVersion.setImage(persistedImage);
            processedVersion.setVersionNumber(2);
            processedVersion.setUrl(context.getOutputUrl());
            processedVersion.setWidth(context.getImage() != null ? context.getImage().getWidth() : 0);
            processedVersion.setHeight(context.getImage() != null ? context.getImage().getHeight() : 0);
            processedVersion.setFileSize(null);
            processedVersion.setVersionType("PROCESSED");
            processedVersion.setPipelineStepsJson(objectMapper.writeValueAsString(requestDto));
            imageVersionRepository.save(processedVersion);
            log.info("Saved processed version tracking record");

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

    @GetMapping("/public")
    public ResponseEntity<?> publicFeed(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);
        Page<Image> imagePage = imageService.getPublicImages(null, pageable);

        Optional<User> currentUserOpt = Optional.empty();
        String email = SecurityUtil.getCurrentUserEmail();
        if (email != null && !email.isBlank()) {
            currentUserOpt = userRepository.findByEmailWithRole(email);
        }

        List<ImageFeedItem> items = imageService.toFeedItems(imagePage, currentUserOpt);

        return ResponseEntity.ok(Map.of(
                "items", items,
                "page", imagePage.getNumber(),
                "size", imagePage.getSize(),
                "totalItems", imagePage.getTotalElements(),
                "totalPages", imagePage.getTotalPages()
        ));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchFeed(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);
        Page<Image> imagePage = imageService.getPublicImages(query, pageable);

        Optional<User> currentUserOpt = Optional.empty();
        String email = SecurityUtil.getCurrentUserEmail();
        if (email != null && !email.isBlank()) {
            currentUserOpt = userRepository.findByEmailWithRole(email);
        }

        List<ImageFeedItem> items = imageService.toFeedItems(imagePage, currentUserOpt);

        return ResponseEntity.ok(Map.of(
                "items", items,
                "page", imagePage.getNumber(),
                "size", imagePage.getSize(),
                "totalItems", imagePage.getTotalElements(),
                "totalPages", imagePage.getTotalPages()
        ));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> userPublicImages(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        int normalizedPage = Math.max(page, 0);
        int normalizedSize = Math.min(Math.max(size, 1), 50);
        Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);
        Page<Image> imagePage = imageRepository.findByVisibilityAndUser_UserIdOrderByCreatedAtDesc(
                com.pipeline.image.common.Visibility.PUBLIC, userId, pageable);

        Optional<User> currentUserOpt = Optional.empty();
        String email = SecurityUtil.getCurrentUserEmail();
        if (email != null && !email.isBlank()) {
            currentUserOpt = userRepository.findByEmailWithRole(email);
        }

        List<ImageFeedItem> items = imageService.toFeedItems(imagePage, currentUserOpt);

        return ResponseEntity.ok(Map.of(
                "items", items,
                "page", imagePage.getNumber(),
                "size", imagePage.getSize(),
                "totalItems", imagePage.getTotalElements(),
                "totalPages", imagePage.getTotalPages()
        ));
    }

    @PostMapping("/{id}/like")
    @Transactional
    public ResponseEntity<?> likeImage(@PathVariable("id") String id) {
        try {
            User user = currentUser();
            Image image = imageRepository.findById(id).orElseThrow(() -> new InvalidException("Image not found"));
            Optional<com.pipeline.image.entity.ImageLike> existing = imageLikeRepository.findByImage_ImageIdAndUser_UserId(id, user.getUserId());
            if (existing.isPresent()) {
                imageLikeRepository.delete(existing.get());
                image.setLikesCount(Math.max(0L, image.getLikesCount() == null ? 0L : image.getLikesCount() - 1));
                imageRepository.save(image);
                return ResponseEntity.ok(Map.of(
                        "likes", image.getLikesCount(),
                        "liked", false
                ));
            }
            com.pipeline.image.entity.ImageLike like = new com.pipeline.image.entity.ImageLike();
            like.setImage(image);
            like.setUser(user);
            imageLikeRepository.save(like);
            image.setLikesCount(image.getLikesCount() == null ? 1L : image.getLikesCount() + 1);
            imageRepository.save(image);
            return ResponseEntity.ok(Map.of(
                    "likes", image.getLikesCount(),
                    "liked", true
            ));
        } catch (InvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/like")
    @Transactional
    public ResponseEntity<?> unlikeImage(@PathVariable("id") String id) {
        try {
            User user = currentUser();
            Image image = imageRepository.findById(id).orElseThrow(() -> new InvalidException("Image not found"));
            Optional<com.pipeline.image.entity.ImageLike> existing = imageLikeRepository.findByImage_ImageIdAndUser_UserId(id, user.getUserId());
            if (existing.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Not liked"));
            }
            imageLikeRepository.delete(existing.get());
            image.setLikesCount(Math.max(0L, image.getLikesCount() == null ? 0L : image.getLikesCount() - 1));
            imageRepository.save(image);
            return ResponseEntity.ok(Map.of("likes", image.getLikesCount()));
        } catch (InvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/comment")
    @Transactional
    public ResponseEntity<?> commentImage(@PathVariable("id") String id, @RequestBody CommentRequestDto req) {
        try {
            User user = currentUser();
            Image image = imageRepository.findById(id).orElseThrow(() -> new InvalidException("Image not found"));
            com.pipeline.image.entity.ImageComment comment = new com.pipeline.image.entity.ImageComment();
            comment.setImage(image);
            comment.setUser(user);
            comment.setContent(req.getContent());
            imageCommentRepository.save(comment);
            image.setCommentsCount(image.getCommentsCount() == null ? 1L : image.getCommentsCount() + 1);
            imageRepository.save(image);
            return ResponseEntity.ok(Map.of("comments", image.getCommentsCount()));
        } catch (InvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/view")
    @Transactional
    public ResponseEntity<?> viewImage(@PathVariable("id") String id) {
        Image image = imageRepository.findById(id).orElse(null);
        if (image == null) return ResponseEntity.notFound().build();

        String clientKey = "anon:" + httpServletRequest.getRemoteAddr();
        try {
            Optional<User> u = Optional.empty();
            String em = SecurityUtil.getCurrentUserEmail();
            if (em != null && !em.isBlank()) {
                u = userRepository.findByEmailWithRole(em);
            }
            if (u.isPresent()) clientKey = "user:" + u.get().getUserId();
        } catch (Exception ignored) {}

        long views = imageService.viewImage(image, clientKey);
        return ResponseEntity.ok(Map.of("views", views));
    }

    @GetMapping("/{id}/comments")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getComments(@PathVariable("id") String id) {
        try {
            Image image = imageRepository.findById(id).orElse(null);
            if (image == null) {
                return ResponseEntity.notFound().build();
            }

            var comments = imageCommentRepository.findByImage_ImageIdOrderByCreatedAtDesc(id).stream().map(c -> {
                java.util.Map<String, Object> commentMap = new java.util.LinkedHashMap<>();
                commentMap.put("id", c.getId());

                java.util.Map<String, Object> userMap = new java.util.LinkedHashMap<>();
                if (c.getUser() != null) {
                    userMap.put("id", c.getUser().getUserId());
                    userMap.put("username", c.getUser().getUsername());
                    userMap.put("avatar", c.getUser().getAvatar());
                    commentMap.put("user", userMap);
                } else {
                    commentMap.put("user", null);
                }

                commentMap.put("content", c.getContent());
                commentMap.put("createdAt", c.getCreatedAt());
                return commentMap;
            }).toList();

            return ResponseEntity.ok(Map.of("items", comments));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to fetch comments"));
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

            Optional<User> currentUserOpt = userRepository.findByEmailWithRole(currentUser.getEmail());
            var items = imageService.toFeedItems(imagePage, currentUserOpt);

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

    @GetMapping("/me/liked")
    public ResponseEntity<Map<String, Object>> myLikedImages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size
    ) {
        try {
            User currentUser = currentUser();
            int normalizedPage = Math.max(page, 0);
            int normalizedSize = Math.min(Math.max(size, 1), 50);
            Pageable pageable = PageRequest.of(normalizedPage, normalizedSize);

            Page<com.pipeline.image.entity.ImageLike> likePage = imageLikeRepository
                    .findByUser_UserIdOrderByCreatedAtDesc(currentUser.getUserId(), pageable);

            var items = likePage.getContent()
                    .stream()
                    .map(like -> {
                        Image image = like.getImage();
                        java.util.Map<String, Object> item = new java.util.LinkedHashMap<>();
                        item.put("id", image.getImageId());
                        item.put("url", image.getUrl());
                        item.put("createdAt", image.getCreatedAt());
                        item.put("prompt", image.getPrompt());
                        item.put("likes", image.getLikesCount());
                        item.put("comments", image.getCommentsCount());
                        item.put("views", image.getViewsCount());
                        item.put("likedByCurrentUser", true);

                        if (image.getUser() != null) {
                            java.util.Map<String, Object> owner = new java.util.LinkedHashMap<>();
                            owner.put("userId", image.getUser().getUserId());
                            owner.put("username", image.getUser().getUsername());
                            owner.put("avatar", image.getUser().getAvatar());
                            item.put("owner", owner);
                        } else {
                            item.put("owner", null);
                        }

                        return item;
                    })
                    .toList();

            return ResponseEntity.ok(Map.of(
                    "items", items,
                    "page", likePage.getNumber(),
                    "size", likePage.getSize(),
                    "totalItems", likePage.getTotalElements(),
                    "totalPages", likePage.getTotalPages()
            ));
        } catch (InvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/visibility")
    @Transactional
    public ResponseEntity<?> updateVisibility(
            @PathVariable("id") String id,
            @RequestParam("visibility") String visibilityStr
    ) {
        try {
            User currentUser = currentUser();
            Image image = imageRepository.findById(id)
                    .orElseThrow(() -> new InvalidException("Image not found"));

            if (image.getUser() == null || !image.getUser().getUserId().equals(currentUser.getUserId())) {
                return ResponseEntity.status(403).body(Map.of("error", "You do not own this image"));
            }

            try {
                Visibility newVisibility = Visibility.valueOf(visibilityStr.toUpperCase());
                image.setVisibility(newVisibility);
                imageRepository.save(image);
                return ResponseEntity.ok(Map.of(
                        "id", image.getImageId(),
                        "visibility", image.getVisibility().name()
                ));
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid visibility value. Allowed: PUBLIC, PRIVATE, UNLISTED"));
            }
        } catch (InvalidException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/metadata")
    @Transactional
    public ResponseEntity<?> updateMetadata(
            @PathVariable("id") String id,
            @RequestBody ImageMetadataRequestDto req
    ) {
        try {
            User currentUser = currentUser();
            Image image = imageRepository.findById(id)
                    .orElseThrow(() -> new InvalidException("Image not found"));

            if (image.getUser() == null || !image.getUser().getUserId().equals(currentUser.getUserId())) {
                return ResponseEntity.status(403).body(Map.of("error", "You do not own this image"));
            }

            if (req.getTitle() != null) {
                image.setTitle(req.getTitle());
            }
            if (req.getPrompt() != null) {
                image.setPrompt(req.getPrompt());
            }
            if (req.getTags() != null) {
                image.setTags(req.getTags());
            }
            if (req.getDescription() != null) {
                image.setDescription(req.getDescription());
            }

            imageRepository.save(image);

            return ResponseEntity.ok(Map.of(
                    "id", image.getImageId(),
                    "title", image.getTitle() != null ? image.getTitle() : "",
                    "prompt", image.getPrompt() != null ? image.getPrompt() : "",
                    "tags", image.getTags() != null ? image.getTags() : "",
                    "description", image.getDescription() != null ? image.getDescription() : ""
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

