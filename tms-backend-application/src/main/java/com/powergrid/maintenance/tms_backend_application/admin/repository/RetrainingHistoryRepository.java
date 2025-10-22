package com.powergrid.maintenance.tms_backend_application.admin.repository;

import com.powergrid.maintenance.tms_backend_application.admin.domain.RetrainingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for RetrainingHistory entity
 */
@Repository
public interface RetrainingHistoryRepository extends JpaRepository<RetrainingHistory, Long> {

    /**
     * Find by run ID
     */
    Optional<RetrainingHistory> findByRunId(String runId);

    /**
     * Find latest completed retraining
     */
    @Query("SELECT r FROM RetrainingHistory r WHERE r.status = 'COMPLETED' ORDER BY r.completedAt DESC")
    List<RetrainingHistory> findCompletedOrderByCompletedAtDesc();

    /**
     * Get latest completed retraining
     */
    default Optional<RetrainingHistory> findLatestCompleted() {
        List<RetrainingHistory> results = findCompletedOrderByCompletedAtDesc();
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    /**
     * Find last successful retraining timestamp
     */
    default Optional<LocalDateTime> findLastCompletedTimestamp() {
        return findLatestCompleted().map(RetrainingHistory::getCompletedAt);
    }

    /**
     * Find all by status
     */
    List<RetrainingHistory> findByStatusOrderByStartedAtDesc(String status);

    /**
     * Find recent history
     */
    List<RetrainingHistory> findTop10ByOrderByStartedAtDesc();
}
