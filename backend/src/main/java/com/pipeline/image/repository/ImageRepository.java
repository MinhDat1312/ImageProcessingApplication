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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.pipeline.image.common.Visibility;

@Repository
public interface ImageRepository extends JpaRepository<Image, String>, JpaSpecificationExecutor<Image> {
    List<Image> findByUser_UserIdOrderByCreatedAtDesc(String userId);

    Page<Image> findByUser_UserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Optional<Image> findByImageIdAndUser_UserId(String id, String userId);

    @Query("SELECT i FROM Image i LEFT JOIN FETCH i.user u LEFT JOIN FETCH u.role")
    List<Image> findAllWithUser();

    Page<Image> findByVisibilityOrderByCreatedAtDesc(Visibility visibility, Pageable pageable);

    Page<Image> findByVisibilityAndUser_UserIdOrderByCreatedAtDesc(Visibility visibility, String userId, Pageable pageable);

    @Query("SELECT i FROM Image i WHERE i.visibility = :visibility AND " +
           "(LOWER(coalesce(i.title, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(coalesce(i.prompt, '')) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(coalesce(i.tags, '')) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Image> searchPublicImages(Visibility visibility, String query, Pageable pageable);
}