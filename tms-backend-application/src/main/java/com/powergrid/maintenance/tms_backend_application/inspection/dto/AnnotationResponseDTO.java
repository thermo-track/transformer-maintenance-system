package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for annotation operation response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationResponseDTO {
    private boolean success;
    private Long annotationId;
    private Long actionId;
    private Long supersededAnnotationId; // for EDIT operations
    private String message;

    public static AnnotationResponseDTO success(Long annotationId, Long actionId, String message) {
        return new AnnotationResponseDTO(true, annotationId, actionId, null, message);
    }

    public static AnnotationResponseDTO successWithSuperseded(Long annotationId, Long actionId, 
                                                               Long supersededId, String message) {
        return new AnnotationResponseDTO(true, annotationId, actionId, supersededId, message);
    }

    public static AnnotationResponseDTO error(String message) {
        return new AnnotationResponseDTO(false, null, null, null, message);
    }
}
