package com.powergrid.maintenance.tms_backend_application.transformer.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TransformerCreateRequest(
  @NotBlank String transformerNo,
  @NotBlank String poleNo,
  @NotBlank String region,  // enum: NORTH, SOUTH, ...
  @NotBlank String type,    // enum: DISTRIBUTION, ...
  @Size(max = 1024) String locationDetails
) {}
