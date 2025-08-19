package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import jakarta.validation.constraints.Size;

public record TransformerUpdateRequest(
  String poleNo,
  String region,
  String type,
  @Size(max = 1024) String locationDetails
) {}

