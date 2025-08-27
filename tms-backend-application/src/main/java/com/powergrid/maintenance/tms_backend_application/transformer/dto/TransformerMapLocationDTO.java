package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransformerMapLocationDTO {
    private String transformerNo;
    private String type;
    private String region;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private String poleNo;
    private String locationDetails;
}