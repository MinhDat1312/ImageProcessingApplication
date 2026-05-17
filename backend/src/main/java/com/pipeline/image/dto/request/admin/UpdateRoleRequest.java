package com.pipeline.image.dto.request.admin;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateRoleRequest {
    private String name;
    private String description;
    private Boolean active;
}
