package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.Data;

@Data
public class ThresholdConfigDTO {
    private Double thresholdPct = 5.0;
    private Double iouThresh = 1.0;
    private Double confThresh = 0.50;
}