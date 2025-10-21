package com.powergrid.maintenance.tms_backend_application.inspection.repository;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnnotationAction;
import com.powergrid.maintenance.tms_backend_application.inspection.model.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for AnnotationAction entity
 */
@Repository
public interface AnnotationActionRepository extends JpaRepository<AnnotationAction, Long> {

    /**
     * Find all actions for a specific anomaly
     */
    List<AnnotationAction> findByAnomalyIdOrderByActionTimestampDesc(Long anomalyId);

    /**
     * Find all actions for a specific inspection
     */
    List<AnnotationAction> findByInspectionIdOrderByActionTimestampDesc(Long inspectionId);

    /**
     * Find all actions by a specific user
     */
    List<AnnotationAction> findByUserIdOrderByActionTimestampDesc(Integer userId);

    /**
     * Find actions by type for an inspection
     */
    List<AnnotationAction> findByInspectionIdAndActionTypeOrderByActionTimestampDesc(
            Long inspectionId, ActionType actionType);

    /**
     * Count actions for an inspection
     */
    long countByInspectionId(Long inspectionId);

    /**
     * Delete all actions for an inspection
     */
    int deleteByInspectionId(Long inspectionId);
}
