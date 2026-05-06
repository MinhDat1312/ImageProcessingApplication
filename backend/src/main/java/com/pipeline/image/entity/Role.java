package com.pipeline.image.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

import static jakarta.persistence.CascadeType.MERGE;
import static jakarta.persistence.CascadeType.PERSIST;
import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "roles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"permissions", "users"})
public class Role extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String roleId;
    @Column(columnDefinition = "TEXT")
    private String description;
    private boolean active;
    @NotBlank(message = "Role name is not empty")
    private String name;

    @OneToMany(mappedBy = "role", fetch = LAZY, cascade = {PERSIST, MERGE})
    private List<User> users = new ArrayList<>();

    @ManyToMany(fetch = LAZY)
    @JoinTable(
            name = "role_permission",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @JsonIgnoreProperties(value = {"roles"})
    private List<Permission> permissions = new ArrayList<>();


}
