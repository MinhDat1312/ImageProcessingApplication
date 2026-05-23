package com.pipeline.image.repository;

import com.pipeline.image.entity.PipelinePreset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipelinePresetRepository extends JpaRepository<PipelinePreset, String> {
    List<PipelinePreset> findByUser_UserIdOrderByCreatedAtDesc(String userId);
}
