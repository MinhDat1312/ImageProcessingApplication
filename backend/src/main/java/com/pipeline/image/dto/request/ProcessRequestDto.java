package com.pipeline.image.dto.request;

import com.pipeline.image.common.FilterType;
import lombok.Data;

@Data
public class ProcessRequestDto {
    private Integer resizeWidth;
    private Integer resizeHeight;
    
    private FilterType filterType; // grayscale, sepia, brightness, or none
    private Float brightnessLevel; // > 1.0 lighter, < 1.0 darker
    
    private String watermarkText;
    private String watermarkPosition; // top-left, top-right, center, bottom-left, bottom-right
    private Integer watermarkSize;
    
    private Float compressionQuality; // 0.1 to 1.0
}
