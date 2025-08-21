package com.powergrid.maintenance.tms_backend_application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ImageUploadDTO {
    @NotBlank(message = "Environmental condition is required")
    @Pattern(regexp = "^(SUNNY|CLOUDY|RAINY)$", 
            flags = Pattern.Flag.CASE_INSENSITIVE,
            message = "Environmental condition must be one of: SUNNY, CLOUDY, RAINY")
    private String environmentalCondition;
}