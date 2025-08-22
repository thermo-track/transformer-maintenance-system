package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImageUploadDTO {
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description; // Optional field for image description
    
}