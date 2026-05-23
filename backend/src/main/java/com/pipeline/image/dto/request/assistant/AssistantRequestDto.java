package com.pipeline.image.dto.request.assistant;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssistantRequestDto {
    @NotBlank
    private String input;

    private String context;

    private String negativePrompt;
}