package com.pipeline.image.dto.request.admin;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CreateRoleRequest {
    @NotBlank(message = "Tên vai trò không được để trống")
    private String name;
    private String description;
}
