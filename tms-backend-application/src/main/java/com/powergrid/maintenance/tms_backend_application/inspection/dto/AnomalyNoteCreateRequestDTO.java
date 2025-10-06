package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnomalyNoteCreateRequestDTO {
    
    @NotBlank(message = "Note text is required")
    @Size(max = 5000, message = "Note text cannot exceed 5000 characters")
    private String note;
    
    @NotBlank(message = "Created by is required")
    @Size(max = 100, message = "Created by cannot exceed 100 characters")
    private String createdBy;
}