package com.pipeline.image.repository;

import com.pipeline.image.entity.ImageLike;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageLikeRepository extends JpaRepository<ImageLike, String> {
    List<ImageLike> findByImage_ImageId(String imageId);
    java.util.Optional<com.pipeline.image.entity.ImageLike> findByImage_ImageIdAndUser_UserId(String imageId, String userId);
    java.util.List<com.pipeline.image.entity.ImageLike> findByImage_ImageIdInAndUser_UserId(java.util.List<String> imageIds, String userId);
    Page<ImageLike> findByUser_UserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
