package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class InspectionStatusUpdateRequestDTO {
    
    @NotBlank(message = "Status is required")
    @Pattern(regexp = "^(IN_PROGRESS|COMPLETED|PENDING|SCHEDULED)$", 
             message = "Status must be one of: IN_PROGRESS, COMPLETED, PENDING, SCHEDULED")
    private String status;
}