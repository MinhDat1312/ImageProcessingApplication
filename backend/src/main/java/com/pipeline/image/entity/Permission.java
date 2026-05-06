package com.pipeline.image.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@ToString(exclude = {"roles"})
public class Permission extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String permissionId;
    @NotBlank(message = "API path is not empty")
    private String apiPath;
    @NotBlank(message = "Method is not empty")
    private String method;
    @NotBlank(message = "Module is not empty")
    private String module;
    @NotBlank(message = "Permission name is not empty")
    private String name;

    @ManyToMany(mappedBy = "permissions", fetch = LAZY)
    @JsonIgnore
    private List<Role> roles = new ArrayList<>();
}
