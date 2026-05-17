package com.pipeline.image.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePermissionRequest {
    @NotBlank(message = "Tên quyền hạn không được để trống")
    private String name;
    @NotBlank(message = "API path không được để trống")
    private String apiPath;
    @NotBlank(message = "Method không được để trống")
    private String method;
    @NotBlank(message = "Module không được để trống")
    private String module;
}
