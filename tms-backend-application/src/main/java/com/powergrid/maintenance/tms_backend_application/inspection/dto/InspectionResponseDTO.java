// InspectionResponseDTO
package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import java.time.ZonedDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class InspectionResponseDTO {
    private String inspectionId;
    private String branch;
    private String transformerNo;
    private String status;
    private String inspectedBy; // Username of the inspector who created this inspection

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime inspectionTimestamp;

    // Alias for frontend compatibility
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime inspectionDate;

    private String poleNo;
    private String region;
    private String type;
    private String locationDetails;
    
    // Environmental and image data
    private String environmentalCondition;
    private String cloudImageUrl;
    private String thermalImageUrl; // Alias for cloudImageUrl
    private String annotatedImageUrl; // For future use with annotated images
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime cloudUploadedAt;
}