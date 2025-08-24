// TransformerLocationResponseDTO.java
package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;

@Data
public class TransformerLocationResponseDTO {
    private String id;
    private String transformerNo;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String address;
    private Instant locationSetAt;
    private boolean success;
    private String message;
}