package com.pipeline.image.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PipelinePresetRequestDto {
    @NotBlank(message = "Preset name is required")
    @Size(max = 250, message = "Preset name must not exceed 250 characters")
    private String name;

    @NotBlank(message = "Pipeline steps are required")
    @Size(max = 4096, message = "Pipeline configuration exceeds maximum supported size")
    private String stepsJson;
}
