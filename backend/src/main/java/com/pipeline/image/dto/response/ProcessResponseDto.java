package com.pipeline.image.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessResponseDto {
    private String url;
    private String filename;
    private Long executionTimeMs;
    private String imageId;
}
