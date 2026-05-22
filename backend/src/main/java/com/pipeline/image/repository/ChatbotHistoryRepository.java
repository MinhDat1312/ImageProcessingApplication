package com.pipeline.image.repository;

import com.pipeline.image.entity.ChatbotHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatbotHistoryRepository extends JpaRepository<ChatbotHistory, String> {
    List<ChatbotHistory> findByUser_UserIdOrderByCreatedAtAsc(String userId);
    Page<ChatbotHistory> findByUser_UserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
}
