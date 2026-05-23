package com.pipeline.image.repository;

import com.pipeline.image.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByUser_UserIdOrderByCreatedAtDesc(String userId);
    List<Notification> findByUser_UserIdAndIsReadOrderByCreatedAtDesc(String userId, boolean isRead);
}
