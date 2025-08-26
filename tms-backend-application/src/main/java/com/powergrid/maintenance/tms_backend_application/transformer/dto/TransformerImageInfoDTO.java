// TransformerImageInfoDTO.java  
package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import lombok.Data;
import java.time.Instant;

@Data
public class TransformerImageInfoDTO {
    private String transformerId;
    private String transformerNo;
    private ImageInfo sunnyImage;
    private ImageInfo cloudyImage;
    private ImageInfo rainyImage;
    
    @Data
    public static class ImageInfo {
        private String imageName;
        private String imageType;
        private boolean hasImage;
        private String uploadedBy;
        private Instant uploadedAt;
        
        // Additional fields for cloud storage
        private String imageUrl;
        private String cloudinaryPublicId;
    }
}