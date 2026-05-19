package com.pipeline.image.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "login_logs",
    indexes = { @Index(name = "idx_login_log_created_at", columnList = "created_at") }
)
@Getter
@Setter
@NoArgsConstructor
public class LoginLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String logId;
    private String userId;
    private String email;

    public LoginLog(String userId, String email) {
        this.userId = userId;
        this.email = email;
    }
}
