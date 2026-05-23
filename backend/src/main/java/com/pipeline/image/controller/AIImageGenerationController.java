package com.pipeline.image.controller;

import com.pipeline.image.dto.request.AIImageGenerationRequestDto;
import com.pipeline.image.entity.Image;
import com.pipeline.image.service.AIImageGenerationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/images/generate")
@RequiredArgsConstructor
@Slf4j
public class AIImageGenerationController {

    private final AIImageGenerationService aiImageGenerationService;

    @PostMapping
    public ResponseEntity<?> generateImage(@RequestBody AIImageGenerationRequestDto requestDto) {
        try {
            if (requestDto.getPrompt() == null || requestDto.getPrompt().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Prompt is required"));
            }
            Image generatedImage = aiImageGenerationService.generateAIImage(requestDto);
            return ResponseEntity.ok(Map.of(
                    "id", generatedImage.getImageId(),
                    "url", generatedImage.getUrl(),
                    "prompt", generatedImage.getPrompt(),
                    "width", generatedImage.getWidth(),
                    "height", generatedImage.getHeight()
            ));
        } catch (Exception e) {
            log.error("Failed to generate AI image", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "AI Image generation failed: " + e.getMessage()));
        }
    }
}
