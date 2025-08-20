package com.powergrid.maintenance.tms_backend_application.dto;

import java.time.LocalDate;
import java.time.LocalTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class InspectionUpdateRequestDTO {
    @NotBlank(message = "Branch cannot be empty")
    private String branch;
    
    @NotBlank(message = "Transformer ID cannot be empty")
    @Pattern(regexp = "^[A-Za-z0-9-_]+$", message = "Transformer ID can only contain alphanumeric characters, hyphens, and underscores")
    private String transformerId;
    
    @NotNull(message = "Date of inspection is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate dateOfInspection;
    
    @NotNull(message = "Inspection time is required")
    @JsonFormat(pattern = "HH:mm")
    private LocalTime timeOfInspection;
}
