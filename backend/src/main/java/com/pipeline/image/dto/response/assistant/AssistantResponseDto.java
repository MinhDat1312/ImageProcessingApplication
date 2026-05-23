package com.pipeline.image.dto.response.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantResponseDto {
    private String mode;
    private String model;
    private String content;
    private List<String> suggestions;
    private boolean fallback;
}