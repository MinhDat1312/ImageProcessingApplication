package com.pipeline.image.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class StorageResponse {
    private String publicId;
    private String url;
}
