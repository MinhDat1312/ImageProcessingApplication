package com.pipeline.image.dto.response.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminImageResponse {
    private String id;
    private String filename;
    private String url;
    private OwnerInfo owner;
    private Instant createdAt;

    @Getter
    @Setter
    public static class OwnerInfo {
        private String userId;
        private String username;
        private String email;

        public OwnerInfo(String userId, String username, String email) {
            this.userId = userId;
            this.username = username;
            this.email = email;
        }
    }
}
