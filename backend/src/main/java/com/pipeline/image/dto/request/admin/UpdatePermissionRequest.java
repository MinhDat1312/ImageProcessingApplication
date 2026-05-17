package com.pipeline.image.dto.request.admin;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdatePermissionRequest {
    private String name;
    private String apiPath;
    private String method;
    private String module;
}
