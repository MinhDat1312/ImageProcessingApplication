package com.pipeline.image.controller;

import com.pipeline.image.core.ImagePipeline;
import com.pipeline.image.core.PipelineContext;
import com.pipeline.image.dto.ProcessRequestDto;
import com.pipeline.image.stages.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
@CrossOrigin(origins = "*")
public class ImageController {

    @Value("${app.image.storage.dir:processed-images}")
    private String storageDir;

    @PostMapping("/process")
    public ResponseEntity<?> processImage(
            @RequestParam("file") MultipartFile file,
            @ModelAttribute ProcessRequestDto requestDto) {
        
        try {
            // Create pipeline context
            PipelineContext context = new PipelineContext(file);
            
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
            pipeline.addStage(new OutputStage(storageDir, String.valueOf(quality)));
            
            // Execute pipeline
            context = pipeline.execute(context);
            
            // Check for errors
            if (context.isHasError()) {
                return ResponseEntity.badRequest().body(Map.of("error", context.getErrorMessage()));
            }
            
            // Return response
            Map<String, Object> response = new HashMap<>();
            response.put("url", context.getOutputUrl());
            response.put("filename", context.getOutputFilename());
            response.put("executionTimeMs", context.getExecutionTimeMs());
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

