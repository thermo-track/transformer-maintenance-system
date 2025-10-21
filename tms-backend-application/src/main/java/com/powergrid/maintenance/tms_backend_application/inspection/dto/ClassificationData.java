package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for classification data stored in JSONB fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ClassificationData {
    private String faultType;
    private Double confidence;
    private Integer classId;
}
