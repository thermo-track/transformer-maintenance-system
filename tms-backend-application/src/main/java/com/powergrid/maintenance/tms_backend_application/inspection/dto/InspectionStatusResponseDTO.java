package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.Data;

@Data
public class InspectionStatusResponseDTO {

    private String inspectionId;
    private String transformerNo;
    private String status;

}