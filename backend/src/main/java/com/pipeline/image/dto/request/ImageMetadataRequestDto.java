package com.pipeline.image.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ImageMetadataRequestDto {
    private String title;
    private String prompt;
    private String tags;
    private String description;
}
