package com.pipeline.image.repository;

import com.pipeline.image.entity.LoginLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LoginLogRepository extends JpaRepository<LoginLog, String> {

    // Returns rows: [hour (int), count (long)] for a given date string "YYYY-MM-DD"
    @Query(value = """
        SELECT EXTRACT(HOUR FROM created_at)::integer AS hour, COUNT(*) AS cnt
        FROM login_logs
        WHERE DATE(created_at) = CAST(:date AS date)
        GROUP BY hour
        ORDER BY hour
        """, nativeQuery = true)
    List<Object[]> findHourlyStatsByDate(@Param("date") String date);

    // Returns rows: [day (int), count (long)] for a given month string "YYYY-MM"
    @Query(value = """
        SELECT EXTRACT(DAY FROM created_at)::integer AS day, COUNT(*) AS cnt
        FROM login_logs
        WHERE TO_CHAR(created_at, 'YYYY-MM') = :month
        GROUP BY day
        ORDER BY day
        """, nativeQuery = true)
    List<Object[]> findDailyStatsByMonth(@Param("month") String month);

    // Returns rows: [month (int), count (long)] for a given year
    @Query(value = """
        SELECT EXTRACT(MONTH FROM created_at)::integer AS month, COUNT(*) AS cnt
        FROM login_logs
        WHERE EXTRACT(YEAR FROM created_at) = :year
        GROUP BY month
        ORDER BY month
        """, nativeQuery = true)
    List<Object[]> findMonthlyStatsByYear(@Param("year") int year);

    @Query(value = "SELECT COUNT(*)::bigint FROM login_logs WHERE DATE(created_at) = CURRENT_DATE",
           nativeQuery = true)
    Long countToday();
}
