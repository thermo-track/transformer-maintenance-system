package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InspectionAnomalyRepository extends JpaRepository<InspectionAnomaly, String> {
    List<InspectionAnomaly> findByInspectionId(String inspectionId);
    void deleteByInspectionId(String inspectionId);
}