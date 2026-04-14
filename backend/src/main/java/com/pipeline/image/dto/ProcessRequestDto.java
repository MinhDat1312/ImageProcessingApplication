package com.pipeline.image.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProcessRequestDto {
    @Positive(message = "Resize width must be greater than 0")
    private Integer resizeWidth;

    @Positive(message = "Resize height must be greater than 0")
    private Integer resizeHeight;

    @Pattern(
            regexp = "none|grayscale|sepia|brightness",
            message = "Filter type must be one of: none, grayscale, sepia, brightness"
    )
    private String filterType; // grayscale, sepia, brightness, or none

    @DecimalMin(value = "0.1", message = "Brightness level must be at least 0.1")
    @DecimalMax(value = "3.0", message = "Brightness level must not exceed 3.0")
    private Float brightnessLevel; // > 1.0 lighter, < 1.0 darker

    @Size(max = 120, message = "Watermark text must not exceed 120 characters")
    private String watermarkText;

    @Pattern(
            regexp = "top-left|top-right|center|bottom-left|bottom-right",
            message = "Watermark position must be one of: top-left, top-right, center, bottom-left, bottom-right"
    )
    private String watermarkPosition; // top-left, top-right, center, bottom-left, bottom-right

    @Min(value = 8, message = "Watermark size must be at least 8")
    @Max(value = 200, message = "Watermark size must not exceed 200")
    private Integer watermarkSize;

    @DecimalMin(value = "0.1", message = "Compression quality must be at least 0.1")
    @DecimalMax(value = "1.0", message = "Compression quality must not exceed 1.0")
    private Float compressionQuality; // 0.1 to 1.0

    @AssertTrue(message = "Resize width and resize height must be provided together")
    public boolean isResizeDimensionsValid() {
        return (resizeWidth == null) == (resizeHeight == null);
    }
}
