package com.pipeline.image.repository;

import com.pipeline.image.entity.Image;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, String>, JpaSpecificationExecutor<Image> {
    List<Image> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Image> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<Image> findByIdAndUserId(Long id, Long userId);
}