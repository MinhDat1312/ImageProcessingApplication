package com.pipeline.image.dto.request;

import com.pipeline.image.common.FilterType;
import com.pipeline.image.common.Visibility;
import lombok.Data;

@Data
public class ProcessRequestDto {
    private Integer resizeWidth;
    private Integer resizeHeight;
    
    private FilterType filterType; // grayscale, sepia, brightness, contrast, blur, sharpen, none
    private Float brightnessLevel; // > 1.0 lighter, < 1.0 darker
    private Float contrastLevel;    // > 1.0 higher contrast, < 1.0 lower contrast
    
    private Integer cropX;
    private Integer cropY;
    private Integer cropWidth;
    private Integer cropHeight;
    
    private Integer rotateAngle; // 90, 180, 270
    
    private String watermarkText;
    private String watermarkPosition; // top-left, top-right, center, bottom-left, bottom-right
    private Integer watermarkSize;
    
    private Float compressionQuality; // 0.1 to 1.0

    private Visibility visibility;
}
