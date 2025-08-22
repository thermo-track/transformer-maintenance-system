package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import lombok.Data;

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
        private long imageSize;
        private boolean hasImage;
    }
}