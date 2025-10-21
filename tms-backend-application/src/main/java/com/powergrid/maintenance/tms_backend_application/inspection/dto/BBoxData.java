package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for bounding box data stored in JSONB fields
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class BBoxData {
    private Integer x;
    private Integer y;
    private Integer width;
    private Integer height;
}
