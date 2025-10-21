package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.model.AnomalySource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface InspectionAnomalyRepository extends JpaRepository<InspectionAnomaly, Long> {
    List<InspectionAnomaly> findByInspectionId(Long inspectionId);
    Optional<InspectionAnomaly> findById(Long id);

    /**
     * Find only active anomalies for an inspection
     */
    List<InspectionAnomaly> findByInspectionIdAndIsActiveTrue(Long inspectionId);

    /**
     * Find active anomalies by source
     */
    List<InspectionAnomaly> findByInspectionIdAndIsActiveTrueAndSource(
            Long inspectionId, AnomalySource source);

    /**
     * Find all anomalies including inactive (for export/history)
     */
    List<InspectionAnomaly> findByInspectionIdOrderByCreatedAtDesc(Long inspectionId);

    /**
     * Count active anomalies
     */
    long countByInspectionIdAndIsActiveTrue(Long inspectionId);

    /**
     * Count AI-generated active anomalies
     */
    long countByInspectionIdAndIsActiveTrueAndSource(Long inspectionId, AnomalySource source);

    // Return number of rows deleted so caller can log/verify effect
    @Modifying
    @Transactional
    @Query("DELETE FROM InspectionAnomaly a WHERE a.inspectionId = :inspectionId")
    int deleteByInspectionId(@Param("inspectionId") Long inspectionId);
}

