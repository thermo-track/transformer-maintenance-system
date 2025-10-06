package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnomalyNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnomalyNoteRepository extends JpaRepository<AnomalyNote, Long> {

    @Query("SELECT an FROM AnomalyNote an " +
           "JOIN an.anomaly ia " +
           "WHERE ia.inspectionId = :inspectionId AND an.anomalyId = :anomalyId " +
           "ORDER BY an.createdAt DESC")
    List<AnomalyNote> findByInspectionIdAndAnomalyIdOrderByCreatedAtDesc(
        @Param("inspectionId") String inspectionId,
        @Param("anomalyId") Long anomalyId
    );

    @Query("SELECT an FROM AnomalyNote an " +
           "JOIN an.anomaly ia " +
           "WHERE an.id = :noteId AND ia.inspectionId = :inspectionId AND an.anomalyId = :anomalyId")
    Optional<AnomalyNote> findByIdAndInspectionIdAndAnomalyId(
        @Param("noteId") Long noteId,
        @Param("inspectionId") String inspectionId,
        @Param("anomalyId") Long anomalyId
    );

    @Query("SELECT an FROM AnomalyNote an " +
           "JOIN an.anomaly ia " +
           "WHERE ia.inspectionId = :inspectionId")
    List<AnomalyNote> findByInspectionId(@Param("inspectionId") String inspectionId);

    @Query("SELECT COUNT(an) FROM AnomalyNote an " +
           "JOIN an.anomaly ia " +
           "WHERE ia.inspectionId = :inspectionId AND an.anomalyId = :anomalyId")
    long countByInspectionIdAndAnomalyId(
        @Param("inspectionId") String inspectionId,
        @Param("anomalyId") Long anomalyId
    );
}
