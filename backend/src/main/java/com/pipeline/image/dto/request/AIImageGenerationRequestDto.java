package com.pipeline.image.dto.request;

import lombok.Data;

@Data
public class AIImageGenerationRequestDto {
    private String prompt;
    private String negativePrompt;
    private String aspectRatio; // "1:1", "16:9", "4:3", "9:16"
}
