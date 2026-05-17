package com.pipeline.image.dto.request.admin;

import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UpdateUserRequest {
    @Email(message = "Email không hợp lệ")
    private String email;
    private String roleId;
}
