package com.powergrid.maintenance.tms_backend_application.inspection.inspection.dto;

import lombok.Data;

@Data
public class ImageUploadResponseDTO {
    private String inspectionId;
    private String imageName;
    private String imageType;
    private String environmentalCondition;
    private long imageSize;
    private String message;

}
