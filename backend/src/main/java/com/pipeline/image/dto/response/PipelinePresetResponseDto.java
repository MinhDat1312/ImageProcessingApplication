package com.pipeline.image.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelinePresetResponseDto {
    private String id;
    private String name;
    private String stepsJson;
    private Instant createdAt;
}
