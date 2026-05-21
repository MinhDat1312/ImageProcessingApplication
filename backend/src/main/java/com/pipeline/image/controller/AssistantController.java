package com.pipeline.image.controller;

import com.pipeline.image.dto.request.assistant.AssistantRequestDto;
import com.pipeline.image.dto.response.assistant.AssistantResponseDto;
import com.pipeline.image.service.AssistantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/assistant")
@RequiredArgsConstructor
public class AssistantController {
    private final AssistantService assistantService;

    @PostMapping("/prompt/generate")
    public ResponseEntity<AssistantResponseDto> generatePrompt(@Valid @RequestBody AssistantRequestDto request) {
        return ResponseEntity.ok(assistantService.generatePrompt(request));
    }

    @PostMapping("/prompt/improve")
    public ResponseEntity<AssistantResponseDto> improvePrompt(@Valid @RequestBody AssistantRequestDto request) {
        return ResponseEntity.ok(assistantService.improvePrompt(request));
    }

    @PostMapping("/prompt/suggest")
    public ResponseEntity<AssistantResponseDto> suggestPrompt(@Valid @RequestBody AssistantRequestDto request) {
        return ResponseEntity.ok(assistantService.suggestPrompt(request));
    }

    @PostMapping("/image/explain")
    public ResponseEntity<AssistantResponseDto> explainImage(@Valid @RequestBody AssistantRequestDto request) {
        return ResponseEntity.ok(assistantService.explainImage(request));
    }

    @PostMapping("/chat")
    public ResponseEntity<AssistantResponseDto> chat(@Valid @RequestBody AssistantRequestDto request) {
        return ResponseEntity.ok(assistantService.chat(request));
    }

    @PostMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "assistant"));
    }
}