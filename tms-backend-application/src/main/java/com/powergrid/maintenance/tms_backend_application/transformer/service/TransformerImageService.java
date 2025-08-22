package com.powergrid.maintenance.tms_backend_application.transformer.service;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerImageInfoDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.mapper.TransformerImageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TransformerImageService {
    
    @Autowired
    private TransformerRepository transformerRepository;
    
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"
    );
    
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    
    public ImageUploadResponseDTO uploadBaseImage(String transformerNo, ImageUploadDTO imageUploadDTO,
            MultipartFile file) throws IOException {
        
        validateImageFile(file);
        String weatherCondition = imageUploadDTO.getWeatherCondition();
        validateWeatherCondition(weatherCondition);
        
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            throw new RuntimeException("Transformer not found with transformer number: " + transformerNo);
        }
        
        Transformer transformer = optionalTransformer.get();
        
        try {
            byte[] imageBytes = file.getBytes();
            Instant uploadTime = Instant.now();
            
            // Set image data based on weather condition
            switch (weatherCondition.toUpperCase()) {
                case "SUNNY":
                    transformer.setSunnyImageData(imageBytes);
                    transformer.setSunnyImageName(file.getOriginalFilename());
                    transformer.setSunnyImageType(file.getContentType());
                    transformer.setSunnyImageUploadedBy(imageUploadDTO.getAdminUserId());
                    transformer.setSunnyImageUploadedAt(uploadTime);
                    break;
                case "CLOUDY":
                    transformer.setCloudyImageData(imageBytes);
                    transformer.setCloudyImageName(file.getOriginalFilename());
                    transformer.setCloudyImageType(file.getContentType());
                    transformer.setCloudyImageUploadedBy(imageUploadDTO.getAdminUserId());
                    transformer.setCloudyImageUploadedAt(uploadTime);
                    break;
                case "RAINY":
                    transformer.setRainyImageData(imageBytes);
                    transformer.setRainyImageName(file.getOriginalFilename());
                    transformer.setRainyImageType(file.getContentType());
                    transformer.setRainyImageUploadedBy(imageUploadDTO.getAdminUserId());
                    transformer.setRainyImageUploadedAt(uploadTime);
                    break;
                default:
                    throw new IllegalArgumentException("Invalid weather condition: " + weatherCondition);
            }
            
            Transformer updatedTransformer = transformerRepository.save(transformer);
            return TransformerImageMapper.toImageUploadResponseDTO(updatedTransformer, weatherCondition, file.getSize());
            
        } catch (Exception e) {
            throw new RuntimeException("Error processing image data: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public byte[] getImage(String transformerNo, String weatherCondition) {
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            return null;
        }
        
        Transformer transformer = optionalTransformer.get();
        
        try {
            switch (weatherCondition.toUpperCase()) {
                case "SUNNY":
                    return transformer.getSunnyImageData();
                case "CLOUDY":
                    return transformer.getCloudyImageData();
                case "RAINY":
                    return transformer.getRainyImageData();
                default:
                    return null;
            }
        } catch (Exception e) {
            // Log the error and return null
            System.err.println("Error accessing LOB data: " + e.getMessage());
            return null;
        }
    }
    
    @Transactional(readOnly = true)
    public TransformerImageInfoDTO getTransformerImagesInfo(String transformerNo) {
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            return null;
        }
        
        return TransformerImageMapper.toTransformerImageInfoDTO(optionalTransformer.get());
    }
    
    @Transactional
    public boolean deleteImage(String transformerNo, String weatherCondition) {
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            return false;
        }
        
        Transformer transformer = optionalTransformer.get();
        boolean hasImage = false;
        
        switch (weatherCondition.toUpperCase()) {
            case "SUNNY":
                hasImage = transformer.getSunnyImageName() != null;
                transformer.setSunnyImageData(null);
                transformer.setSunnyImageName(null);
                transformer.setSunnyImageType(null);
                break;
            case "CLOUDY":
                hasImage = transformer.getCloudyImageName() != null;
                transformer.setCloudyImageData(null);
                transformer.setCloudyImageName(null);
                transformer.setCloudyImageType(null);
                break;
            case "RAINY":
                hasImage = transformer.getRainyImageName() != null;
                transformer.setRainyImageData(null);
                transformer.setRainyImageName(null);
                transformer.setRainyImageType(null);
                break;
        }
        
        if (hasImage) {
            transformerRepository.save(transformer);
            return true;
        }
        
        return false;
    }
    
    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size should not exceed 50MB");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Only image files (JPEG, PNG, GIF, BMP) are allowed");
        }
    }
    
    private void validateWeatherCondition(String weatherCondition) {
        if (weatherCondition == null || weatherCondition.trim().isEmpty()) {
            throw new IllegalArgumentException("Weather condition is required");
        }
        
        String condition = weatherCondition.toUpperCase();
        if (!condition.equals("SUNNY") && !condition.equals("CLOUDY") && !condition.equals("RAINY")) {
            throw new IllegalArgumentException("Weather condition must be one of: SUNNY, CLOUDY, RAINY");
        }
    }
}