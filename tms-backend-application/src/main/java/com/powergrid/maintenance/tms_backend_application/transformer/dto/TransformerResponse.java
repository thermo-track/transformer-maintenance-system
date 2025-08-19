package com.powergrid.maintenance.tms_backend_application.transformer.dto;

public record TransformerResponse(
  String id,
  String transformerNo,
  String poleNo,
  String region,
  String type,
  String locationDetails
) {}
