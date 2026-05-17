package com.pipeline.image.dto.response.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.pipeline.image.common.Gender;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminUserResponse {
    private String userId;
    private String username;
    private String email;
    private Gender gender;
    private String avatar;
    private boolean enabled;
    private RoleInfo role;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Setter
    public static class RoleInfo {
        private String roleId;
        private String name;

        public RoleInfo(String roleId, String name) {
            this.roleId = roleId;
            this.name = name;
        }
    }
}
