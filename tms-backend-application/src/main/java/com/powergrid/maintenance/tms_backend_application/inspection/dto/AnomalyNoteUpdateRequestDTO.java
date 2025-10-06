package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AnomalyNoteUpdateRequestDTO {
    
    @NotBlank(message = "Note text is required")
    @Size(max = 5000, message = "Note text cannot exceed 5000 characters")
    private String note;
}