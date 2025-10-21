package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.Data;
import java.time.ZonedDateTime;

@Data
public class ImageMetadataDTO {
    private String cloudImageUrl;
    private String cloudinaryPublicId;
    private String cloudImageName;
    private String cloudImageType;
    private String environmentalCondition;
    private ZonedDateTime cloudUploadedAt;

    private Double thresholdPct = 5.0;
    private Double iouThresh = 1.0;
    private Double confThresh = 0.50;
}