package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransformerLastUpdatedDTO {
    private String transformerNo;
    private Instant lastImageUpdatedAt;
    private String lastUpdatedCondition;
    private String lastUploadedBy;
}