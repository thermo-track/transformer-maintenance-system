package com.powergrid.maintenance.tms_backend_application.inspection.inspection.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class InspectionResponseDTO {
    private String inspectionId;
    private String branch;
    private String transformerId;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfInspection;
    
    @JsonFormat(pattern = "HH:mm")
    private LocalTime timeOfInspection;
}
