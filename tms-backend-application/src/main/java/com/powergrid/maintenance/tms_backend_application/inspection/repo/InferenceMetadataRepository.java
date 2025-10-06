package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InferenceMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.transaction.Transactional;
import java.util.Optional;

@Repository
public interface InferenceMetadataRepository extends JpaRepository<InferenceMetadata, String> {

    Optional<InferenceMetadata> findByInspectionId(Long inspectionId);

    void deleteByInspectionId(Long inspectionId);

    /**
     * Update ONLY the maintenance image URL for a given inspection.
     * Returns number of rows updated (0 if row doesn't exist yet).
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE InferenceMetadata m
           SET m.maintenanceImageUrl = :maintenanceUrl
         WHERE m.inspectionId = :inspectionId
    """)
    int updateMaintenanceUrlOnly(@Param("inspectionId") Long inspectionId,
                                 @Param("maintenanceUrl") String maintenanceUrl);
}
