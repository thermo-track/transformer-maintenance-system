package com.powergrid.maintenance.tms_backend_application.transformer.mapper;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.TransformerImage;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerImageInfoDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerLastUpdatedDTO;


public class TransformerImageMapper {
    
    public static ImageUploadResponseDTO toImageUploadResponseDTO(Transformer transformer, TransformerImage transformerImage) {
        if (transformer == null || transformerImage == null) {
            return null;
        }
        
        ImageUploadResponseDTO responseDTO = new ImageUploadResponseDTO();
        responseDTO.setTransformerId(transformer.getId());
        responseDTO.setTransformerNo(transformer.getTransformerNo());
        responseDTO.setWeatherCondition(transformerImage.getWeatherCondition().name());
        responseDTO.setImageName(transformerImage.getBaseImageName());
        responseDTO.setImageType(transformerImage.getBaseImageType());
        responseDTO.setUploadedBy(transformerImage.getUploadedBy());
        
        // Set the missing Cloudinary fields
        responseDTO.setImageUrl(transformerImage.getBaseImageUrl());
        responseDTO.setCloudinaryPublicId(transformerImage.getBaseCloudinaryPublicId());
        
        // Convert ZonedDateTime to Instant for backward compatibility
        if (transformerImage.getBaseImageUploadedAt() != null) {
            responseDTO.setUploadedAt(transformerImage.getBaseImageUploadedAt().toInstant());
        }

        responseDTO.setMessage("Image uploaded successfully for " + 
            transformerImage.getWeatherCondition().name().toLowerCase() + " condition");
        
        return responseDTO;
    }
    
    public static TransformerImageInfoDTO toTransformerImageInfoDTO(
            Transformer transformer, 
            TransformerImage sunnyImage, 
            TransformerImage cloudyImage, 
            TransformerImage rainyImage) {
        
        if (transformer == null) {
            return null;
        }
        
        TransformerImageInfoDTO dto = new TransformerImageInfoDTO();
        dto.setTransformerId(transformer.getId());
        dto.setTransformerNo(transformer.getTransformerNo());
        
        // Map sunny image info
        dto.setSunnyImage(mapToImageInfo(sunnyImage));
        
        // Map cloudy image info
        dto.setCloudyImage(mapToImageInfo(cloudyImage));
        
        // Map rainy image info
        dto.setRainyImage(mapToImageInfo(rainyImage));
        
        return dto;
    }
    
    private static TransformerImageInfoDTO.ImageInfo mapToImageInfo(TransformerImage transformerImage) {
        TransformerImageInfoDTO.ImageInfo imageInfo = new TransformerImageInfoDTO.ImageInfo();
        
        if (transformerImage != null) {
            imageInfo.setImageName(transformerImage.getBaseImageName());
            imageInfo.setImageType(transformerImage.getBaseImageType());
            imageInfo.setHasImage(true);
            imageInfo.setUploadedBy(transformerImage.getUploadedBy());
            
            // Set the Cloudinary fields
            imageInfo.setImageUrl(transformerImage.getBaseImageUrl());
            imageInfo.setCloudinaryPublicId(transformerImage.getBaseCloudinaryPublicId());
            
            // Convert ZonedDateTime to Instant for backward compatibility
            if (transformerImage.getBaseImageUploadedAt() != null) {
                imageInfo.setUploadedAt(transformerImage.getBaseImageUploadedAt().toInstant());
            }
        } else {
            imageInfo.setImageName(null);
            imageInfo.setImageType(null);
            imageInfo.setHasImage(false);
            imageInfo.setUploadedBy(null);
            imageInfo.setUploadedAt(null);
            imageInfo.setImageUrl(null);
            imageInfo.setCloudinaryPublicId(null);
        }
        
        return imageInfo;
    }
    
    public static TransformerLastUpdatedDTO toLastUpdatedDTO(Transformer transformer, TransformerImage latestImage) {
        if (transformer == null) {
            return null;
        }

        if (latestImage == null) {
            // No images uploaded yet - return transformer's own timestamps as fallback
            return new TransformerLastUpdatedDTO(
                transformer.getTransformerNo(),
                null,  // lastImageUpdatedAt
                null,  // lastUpdatedCondition
                null,  // lastUploadedBy
                transformer.getUpdatedAt(),  // transformerUpdatedAt
                transformer.getCreatedAt()   // transformerCreatedAt
            );
        }

        return new TransformerLastUpdatedDTO(
            transformer.getTransformerNo(),
            latestImage.getBaseImageUploadedAt().toInstant(),
            latestImage.getWeatherCondition().name(),
            latestImage.getUploadedBy(),
            transformer.getUpdatedAt(),  // transformerUpdatedAt
            transformer.getCreatedAt()   // transformerCreatedAt
        );
    }
}