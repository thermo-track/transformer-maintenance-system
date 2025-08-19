package com.sdc.transformermaintenance.transformer.dto;

public record TransformerResponse(
  String id,
  String transformerNo,
  String poleNo,
  String region,
  String type,
  String locationDetails
) {}
