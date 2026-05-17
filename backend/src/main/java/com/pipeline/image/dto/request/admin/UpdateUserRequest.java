package com.pipeline.image.dto.request.admin;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {
    private String email;
    private String role;  // roleId
}
