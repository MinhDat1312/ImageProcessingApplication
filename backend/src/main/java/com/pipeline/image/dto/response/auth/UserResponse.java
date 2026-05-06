package com.pipeline.image.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pipeline.image.common.Gender;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {
    private String userId;
    private String username;
    private String email;
    private Gender gender;
    private String avatar;
    private boolean enabled;
    private RoleUser role;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleUser {
        private String roleId;
        private String name;
    }
}

