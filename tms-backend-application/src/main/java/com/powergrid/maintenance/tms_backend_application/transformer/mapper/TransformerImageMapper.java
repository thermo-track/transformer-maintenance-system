package com.powergrid.maintenance.tms_backend_application.transformer.mapper;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerImageInfoDTO;

public class TransformerImageMapper {
    
    public static ImageUploadResponseDTO toImageUploadResponseDTO(Transformer transformer, String weatherCondition, long imageSize) {
        if (transformer == null) {
            return null;
        }
        
        ImageUploadResponseDTO responseDTO = new ImageUploadResponseDTO();
        responseDTO.setTransformerId(transformer.getId());
        responseDTO.setTransformerNo(transformer.getTransformerNo());
        responseDTO.setWeatherCondition(weatherCondition.toUpperCase());
        responseDTO.setImageSize(imageSize);
        
        // Set image name, type, and upload info based on weather condition
        switch (weatherCondition.toUpperCase()) {
            case "SUNNY":
                responseDTO.setImageName(transformer.getSunnyImageName());
                responseDTO.setImageType(transformer.getSunnyImageType());
                responseDTO.setUploadedBy(transformer.getSunnyImageUploadedBy());
                responseDTO.setUploadedAt(transformer.getSunnyImageUploadedAt());
                break;
            case "CLOUDY":
                responseDTO.setImageName(transformer.getCloudyImageName());
                responseDTO.setImageType(transformer.getCloudyImageType());
                responseDTO.setUploadedBy(transformer.getCloudyImageUploadedBy());
                responseDTO.setUploadedAt(transformer.getCloudyImageUploadedAt());
                break;
            case "RAINY":
                responseDTO.setImageName(transformer.getRainyImageName());
                responseDTO.setImageType(transformer.getRainyImageType());
                responseDTO.setUploadedBy(transformer.getRainyImageUploadedBy());
                responseDTO.setUploadedAt(transformer.getRainyImageUploadedAt());
                break;
        }
        
        responseDTO.setMessage("Image uploaded successfully for " + weatherCondition.toLowerCase() + " condition");
        
        return responseDTO;
    }
    
    public static TransformerImageInfoDTO toTransformerImageInfoDTO(Transformer transformer) {
        if (transformer == null) {
            return null;
        }
        
        TransformerImageInfoDTO dto = new TransformerImageInfoDTO();
        dto.setTransformerId(transformer.getId());
        dto.setTransformerNo(transformer.getTransformerNo());
        
        // Map sunny image info
        TransformerImageInfoDTO.ImageInfo sunnyInfo = new TransformerImageInfoDTO.ImageInfo();
        sunnyInfo.setImageName(transformer.getSunnyImageName());
        sunnyInfo.setImageType(transformer.getSunnyImageType());
        sunnyInfo.setHasImage(transformer.getSunnyImageName() != null);
        sunnyInfo.setUploadedBy(transformer.getSunnyImageUploadedBy());
        sunnyInfo.setUploadedAt(transformer.getSunnyImageUploadedAt());
        // Avoid accessing LOB data directly to prevent "Unable to access lob stream" error
        sunnyInfo.setImageSize(0);
        dto.setSunnyImage(sunnyInfo);
        
        // Map cloudy image info
        TransformerImageInfoDTO.ImageInfo cloudyInfo = new TransformerImageInfoDTO.ImageInfo();
        cloudyInfo.setImageName(transformer.getCloudyImageName());
        cloudyInfo.setImageType(transformer.getCloudyImageType());
        cloudyInfo.setHasImage(transformer.getCloudyImageName() != null);
        cloudyInfo.setUploadedBy(transformer.getCloudyImageUploadedBy());
        cloudyInfo.setUploadedAt(transformer.getCloudyImageUploadedAt());
        // Avoid accessing LOB data directly to prevent "Unable to access lob stream" error
        cloudyInfo.setImageSize(0);
        dto.setCloudyImage(cloudyInfo);
        
        // Map rainy image info
        TransformerImageInfoDTO.ImageInfo rainyInfo = new TransformerImageInfoDTO.ImageInfo();
        rainyInfo.setImageName(transformer.getRainyImageName());
        rainyInfo.setImageType(transformer.getRainyImageType());
        rainyInfo.setHasImage(transformer.getRainyImageName() != null);
        rainyInfo.setUploadedBy(transformer.getRainyImageUploadedBy());
        rainyInfo.setUploadedAt(transformer.getRainyImageUploadedAt());
        // Avoid accessing LOB data directly to prevent "Unable to access lob stream" error
        rainyInfo.setImageSize(0);
        dto.setRainyImage(rainyInfo);
        
        return dto;
    }
}