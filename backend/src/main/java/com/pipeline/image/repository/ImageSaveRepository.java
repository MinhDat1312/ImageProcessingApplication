package com.pipeline.image.repository;

import com.pipeline.image.entity.ImageSave;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageSaveRepository extends JpaRepository<ImageSave, String> {
    List<ImageSave> findByUser_UserId(String userId);
}
