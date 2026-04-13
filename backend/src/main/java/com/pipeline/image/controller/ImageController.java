package com.pipeline.image.controller;

import com.pipeline.image.core.ImagePipeline;
import com.pipeline.image.dto.ProcessRequestDto;
import com.pipeline.image.stages.CompressionStage;
import com.pipeline.image.stages.FilterStage;
import com.pipeline.image.stages.ResizeStage;
import com.pipeline.image.stages.WatermarkStage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "*") // Allow frontend requests
public class ImageController {

    @Value("${app.image.storage.dir:processed-images}")
    private String storageDir;

    @PostMapping("/process")
    public ResponseEntity<?> processImage(
            @RequestParam("file") MultipartFile file,
            @ModelAttribute ProcessRequestDto requestDto) {
        
        try {
            // 1. Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
            }
            String contentType = file.getContentType();
            if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png"))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only JPEG and PNG files are supported"));
            }

            // 2. Load Image
            BufferedImage inputImage = ImageIO.read(file.getInputStream());
            if (inputImage == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid image file"));
            }

            // 3. Build Pipeline Dynamically based on user request
            ImagePipeline pipeline = new ImagePipeline();
            
            // Resize Stage
            if (requestDto.getResizeWidth() != null && requestDto.getResizeHeight() != null) {
                pipeline.addStage(new ResizeStage(requestDto.getResizeWidth(), requestDto.getResizeHeight()));
            }
            
            // Filter Stage
            if ("grayscale".equalsIgnoreCase(requestDto.getFilterType()) ||
                "sepia".equalsIgnoreCase(requestDto.getFilterType()) ||
                "brightness".equalsIgnoreCase(requestDto.getFilterType())) {
                float brightness = requestDto.getBrightnessLevel() != null ? requestDto.getBrightnessLevel() : 1.0f;
                pipeline.addStage(new FilterStage(requestDto.getFilterType(), brightness));
            }
            
            // Watermark Stage
            if (requestDto.getWatermarkText() != null && !requestDto.getWatermarkText().trim().isEmpty()) {
                pipeline.addStage(new WatermarkStage(
                        requestDto.getWatermarkText(),
                        requestDto.getWatermarkPosition(),
                        requestDto.getWatermarkSize() != null ? requestDto.getWatermarkSize() : 30
                ));
            }
            
            // Compression Stage
            float quality = 1.0f;
            if (requestDto.getCompressionQuality() != null) {
                quality = requestDto.getCompressionQuality();
                pipeline.addStage(new CompressionStage(quality));
            }

            // Execute Pipeline
            long startTime = System.currentTimeMillis();
            BufferedImage processedImage = pipeline.execute(inputImage);
            long executionTime = System.currentTimeMillis() - startTime;

            // 4. Save Output locally
            Path storagePath = Paths.get(storageDir);
            if (!Files.exists(storagePath)) {
                Files.createDirectories(storagePath);
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = "jpg"; // Default output format due to potential compression
            if (originalFilename != null && originalFilename.toLowerCase().endsWith(".png") && quality == 1.0f) {
                fileExtension = "png";
            }
            
            String newFilename = UUID.randomUUID().toString() + "." + fileExtension;
            File outputFile = storagePath.resolve(newFilename).toFile();
            ImageIO.write(processedImage, fileExtension, outputFile);

            // 5. Generate URL
            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/images/download/")
                    .path(newFilename)
                    .toUriString();

            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("url", fileDownloadUri);
            response.put("filename", newFilename);
            response.put("executionTimeMs", executionTime);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process image: " + e.getMessage()));
        }
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
}
