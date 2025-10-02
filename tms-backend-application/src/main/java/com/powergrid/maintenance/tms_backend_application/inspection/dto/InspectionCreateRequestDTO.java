// InspectionCreateRequestDTO
package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import java.time.ZonedDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class InspectionCreateRequestDTO {
    @NotBlank(message = "Branch cannot be empty")
    private String branch;

    @NotBlank(message = "Transformer No cannot be empty")
    @Pattern(regexp = "^[A-Za-z0-9-_]+$", message = "Transformer No can only contain alphanumeric characters, hyphens, and underscores")
    private String transformerNo;

    @NotNull(message = "Inspection timestamp is required")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private ZonedDateTime inspectionTimestamp;
    private String status;
}