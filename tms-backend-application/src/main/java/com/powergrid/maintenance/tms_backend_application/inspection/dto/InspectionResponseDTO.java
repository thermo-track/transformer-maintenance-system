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

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime inspectionTimestamp;
}