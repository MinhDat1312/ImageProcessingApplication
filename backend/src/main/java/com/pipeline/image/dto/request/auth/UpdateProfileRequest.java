package com.pipeline.image.dto.request.auth;

import com.pipeline.image.common.Gender;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String username;
    private Gender gender;
    @Size(max = 500, message = "Bio cannot exceed 500 characters")
    private String bio;
}
