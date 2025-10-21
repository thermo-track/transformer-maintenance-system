package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
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

    // Return number of rows deleted so caller can log/verify effect
    @Modifying
    @Transactional
    @Query("DELETE FROM InspectionAnomaly a WHERE a.inspectionId = :inspectionId")
    int deleteByInspectionId(@Param("inspectionId") Long inspectionId);
}
