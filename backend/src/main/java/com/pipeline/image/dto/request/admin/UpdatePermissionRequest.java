package com.pipeline.image.dto.request.admin;

import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdatePermissionRequest {
    private String name;
    private String apiPath;
    @Pattern(regexp = "^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$",
             message = "Method phải là một trong: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS")
    private String method;
    private String module;
}
