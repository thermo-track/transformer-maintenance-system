package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.Data;

@Data
public class ThresholdConfigDTO {
    private Double thresholdPct = 2.0;
    private Double iouThresh = 0.35;
    private Double confThresh = 0.25;
}