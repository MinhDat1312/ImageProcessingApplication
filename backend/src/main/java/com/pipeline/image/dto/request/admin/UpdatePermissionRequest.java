package com.pipeline.image.dto.request.admin;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePermissionRequest {
    private String name;
    private String apiPath;
    private String method;
    private String module;
}
