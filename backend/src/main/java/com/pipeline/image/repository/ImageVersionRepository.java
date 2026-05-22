package com.pipeline.image.repository;

import com.pipeline.image.entity.ImageVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageVersionRepository extends JpaRepository<ImageVersion, String> {
    List<ImageVersion> findByImage_ImageIdOrderByVersionNumberAsc(String imageId);
}
