package com.pipeline.image.dto.response.admin;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AdminPermissionResponse {
    private String permissionId;
    private String name;
    private String apiPath;
    private String method;
    private String module;
}
