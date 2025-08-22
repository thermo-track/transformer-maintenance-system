package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import lombok.Data;

@Data
public class ImageUploadResponseDTO {
    private String transformerId;
    private String transformerNo;
    private String imageName;
    private String imageType;
    private String weatherCondition;
    private long imageSize;
    private String message;
}