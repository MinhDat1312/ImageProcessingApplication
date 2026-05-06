package com.pipeline.image.entity;

import com.pipeline.image.common.Gender;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

import static jakarta.persistence.CascadeType.MERGE;
import static jakarta.persistence.CascadeType.PERSIST;
import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_user_email", columnList = "email")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    protected String userId;
    @NotBlank(message = "Username is required")
    protected String username;
    @NotBlank(message = "Email is required")
    protected String email;
    @NotBlank(message = "Password is required")
    protected String password;
    @Enumerated(EnumType.STRING)
    protected Gender gender;
    protected String avatar;
    protected boolean enabled = false;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "role_id")
    private Role role;

    @OneToMany(mappedBy = "user", fetch = LAZY, cascade = {PERSIST, MERGE})
    private List<Image> images = new ArrayList<>();
}