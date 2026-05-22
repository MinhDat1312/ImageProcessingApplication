package com.pipeline.image.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "image_versions", indexes = {
    @Index(name = "idx_version_image_id", columnList = "image_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ImageVersion extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "image_id", nullable = false)
    private Image image;

    private Integer versionNumber;

    @Column(nullable = false, length = 1024)
    private String url;

    private Integer width;
    private Integer height;
    private Long fileSize;

    @Column(length = 50)
    private String versionType; // ORIGINAL, PROCESSED, AI_GENERATED

    @Column(length = 4096)
    private String pipelineStepsJson; // JSON representation of steps applied
}
