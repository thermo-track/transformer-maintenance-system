package com.powergrid.maintenance.tms_backend_application.inspection.dto;
import java.time.ZonedDateTime;

import lombok.Data;

@Data
public class CloudImageUploadResponseDTO {
    private String inspectionId;
    private String cloudImageUrl;
    private String cloudinaryPublicId;
    private String cloudImageName;
    private String cloudImageType;
    private String environmentalCondition;
    private ZonedDateTime cloudUploadedAt;
}
