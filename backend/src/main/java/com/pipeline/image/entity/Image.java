package com.pipeline.image.entity;

import com.pipeline.image.common.Visibility;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "images")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Image extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String imageId;
    @Column(nullable = false, length = 1024)
    private String url;

    @Column(length = 250)
    private String title;

    @Column(length = 2048)
    private String prompt;

    @Column(length = 4096)
    private String description;

    @Column(length = 1024)
    private String tags; // comma-separated

    @Column(length = 1024)
    private String thumbnailUrl;

    private Integer width;
    private Integer height;

    private Long likesCount = 0L;
    private Long viewsCount = 0L;
    private Long commentsCount = 0L;

    @Enumerated(EnumType.STRING)
    private Visibility visibility = Visibility.PRIVATE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}