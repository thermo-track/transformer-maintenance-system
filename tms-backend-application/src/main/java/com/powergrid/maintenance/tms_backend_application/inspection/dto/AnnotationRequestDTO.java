package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import com.powergrid.maintenance.tms_backend_application.inspection.model.ActionType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating or editing annotations
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationRequestDTO {
    private Long inspectionId;
    private ActionType action; // CREATE, EDIT, DELETE, COMMENT
    private Long anomalyId; // null for CREATE, required for others
    private BBoxData geometry; // bbox data
    private ClassificationData classification; // fault type, confidence, etc.
    private String comment; // optional comment
    private Integer userId; // user performing the action
}
