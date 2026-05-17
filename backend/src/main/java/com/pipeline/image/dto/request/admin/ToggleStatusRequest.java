package com.pipeline.image.dto.request.admin;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ToggleStatusRequest {
    @NotNull(message = "Trạng thái không được để trống")
    private Boolean enabled;
}
