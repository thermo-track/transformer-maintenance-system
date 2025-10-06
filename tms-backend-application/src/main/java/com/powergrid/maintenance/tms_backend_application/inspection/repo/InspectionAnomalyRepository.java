package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface InspectionAnomalyRepository extends JpaRepository<InspectionAnomaly, Long> {
    List<InspectionAnomaly> findByInspectionId(Long inspectionId);
    Optional<InspectionAnomaly> findById(Long id);
    void deleteByInspectionId(Long inspectionId); 
}