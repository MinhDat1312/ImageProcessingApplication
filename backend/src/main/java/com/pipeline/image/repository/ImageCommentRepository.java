package com.pipeline.image.repository;

import com.pipeline.image.entity.ImageComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageCommentRepository extends JpaRepository<ImageComment, String> {
    List<ImageComment> findByImage_ImageIdOrderByCreatedAtDesc(String imageId);
}
