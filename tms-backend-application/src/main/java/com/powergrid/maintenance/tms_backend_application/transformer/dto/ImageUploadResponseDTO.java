// ImageUploadResponseDTO.java
package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class ImageUploadResponseDTO {
    private String transformerId;
    private String transformerNo;
    private String imageName;
    private String imageType;
    private String weatherCondition;
    private String uploadedBy;
    private Instant uploadedAt;
    private String message;
    
    // Additional fields for Cloudinary info
    private String imageUrl;
    private String cloudinaryPublicId;
}
