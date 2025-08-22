// ImageUploadDTO.java
package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImageUploadDTO {
    @NotBlank(message = "Weather condition is required")
    @Pattern(regexp = "^(SUNNY|CLOUDY|RAINY)$",
             flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Weather condition must be one of: SUNNY, CLOUDY, RAINY")
    private String weatherCondition;
    
    @NotBlank(message = "Admin User ID is required")
    @Size(max = 64, message = "Admin User ID cannot exceed 64 characters")
    private String adminUserId;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description; // Optional field for image description
}