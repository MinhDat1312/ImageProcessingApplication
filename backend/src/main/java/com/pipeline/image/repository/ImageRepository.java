package com.pipeline.image.repository;

import com.pipeline.image.entity.Image;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageRepository extends JpaRepository<Image, String>, JpaSpecificationExecutor<Image> {
    List<Image> findByUser_UserIdOrderByCreatedAtDesc(String userId);

    Page<Image> findByUser_UserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Optional<Image> findByImageIdAndUser_UserId(String id, String userId);

    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.user u LEFT JOIN FETCH u.role")
    List<Image> findAllWithUser();
}