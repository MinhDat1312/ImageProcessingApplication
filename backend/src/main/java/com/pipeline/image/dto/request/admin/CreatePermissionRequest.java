package com.pipeline.image.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreatePermissionRequest {
    @NotBlank(message = "Tên quyền hạn không được để trống")
    private String name;
    @NotBlank(message = "API path không được để trống")
    private String apiPath;
    @NotBlank(message = "Method không được để trống")
    @Pattern(regexp = "^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$",
             message = "Method phải là GET, POST, PUT, PATCH, DELETE, HEAD hoặc OPTIONS")
    private String method;
    @NotBlank(message = "Module không được để trống")
    private String module;
}
