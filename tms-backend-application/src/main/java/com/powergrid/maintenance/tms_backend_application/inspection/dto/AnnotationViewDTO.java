package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for returning all annotations for an inspection
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationViewDTO {
    private Long inspectionId;
    private List<InspectionAnomaly> aiDetections; // AI_GENERATED and active
    private List<InspectionAnomaly> userAnnotations; // USER_ADDED and active
    private List<InspectionAnomaly> inactiveDetections; // All inactive (deleted/superseded)
    private int totalActive;
    private int totalInactive;
}
