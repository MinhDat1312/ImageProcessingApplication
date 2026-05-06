package com.pipeline.image.dto.response.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pipeline.image.common.Gender;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LoginResponse {
    private String userId;
    private String username;
    private String email;
    private Gender gender;
    private String avatar;
    private boolean enabled;
    private RoleUser role;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleUser {
        private String roleId;
        private String name;
    }
}
