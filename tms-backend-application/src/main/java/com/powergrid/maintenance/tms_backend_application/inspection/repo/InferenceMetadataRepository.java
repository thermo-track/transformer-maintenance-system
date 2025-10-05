package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InferenceMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface InferenceMetadataRepository extends JpaRepository<InferenceMetadata, String> {
    Optional<InferenceMetadata> findByInspectionId(String inspectionId);
    void deleteByInspectionId(String inspectionId);
}