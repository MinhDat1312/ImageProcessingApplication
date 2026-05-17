package com.pipeline.image.dto.response.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminRoleResponse {
    private String roleId;
    private String name;
    private String description;
    private boolean active;
}
