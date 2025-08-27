package com.powergrid.maintenance.tms_backend_application.transformer.service;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.TransformerImage;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerImageRepository;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerImageInfoDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerLastUpdatedDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.mapper.TransformerImageMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.Optional;

@Service
@Transactional
public class TransformerImageService {
    
    @Autowired
    private TransformerRepository transformerRepository;
    
    @Autowired
    private TransformerImageRepository transformerImageRepository;
    
    public ImageUploadResponseDTO saveImageFromUrl(String transformerId, ImageUploadDTO imageUploadDTO) {
        
        // Validate transformer exists
        Optional<Transformer> optionalTransformer = transformerRepository.findById(transformerId);
        if (optionalTransformer.isEmpty()) {
            throw new RuntimeException("Transformer not found with id: " + transformerId);
        }
        
        Transformer transformer = optionalTransformer.get();
        
        // Parse weather condition
        TransformerImage.WeatherCondition weatherCondition;
        try {
            weatherCondition = TransformerImage.WeatherCondition.valueOf(
                imageUploadDTO.getWeatherCondition().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid weather condition: " + imageUploadDTO.getWeatherCondition());
        }
        
        // Check if image already exists for this weather condition
        Optional<TransformerImage> existingImage = transformerImageRepository
            .findByTransformerIdAndWeatherCondition(transformerId, weatherCondition);
        
        TransformerImage transformerImage;
        
        if (existingImage.isPresent()) {
            // Update existing image
            transformerImage = existingImage.get();
            transformerImage.setBaseImageUrl(imageUploadDTO.getBaseImageUrl());
            transformerImage.setBaseCloudinaryPublicId(imageUploadDTO.getBaseCloudinaryPublicId());
            transformerImage.setBaseImageName(imageUploadDTO.getBaseImageName());
            transformerImage.setBaseImageType(imageUploadDTO.getBaseImageType());
            transformerImage.setUploadedBy(imageUploadDTO.getAdminUserId());
            transformerImage.setBaseImageUploadedAt(ZonedDateTime.now());
        } else {
            // Create new image record
            transformerImage = new TransformerImage();
            transformerImage.setTransformerId(transformerId);
            transformerImage.setWeatherCondition(weatherCondition);
            transformerImage.setBaseImageUrl(imageUploadDTO.getBaseImageUrl());
            transformerImage.setBaseCloudinaryPublicId(imageUploadDTO.getBaseCloudinaryPublicId());
            transformerImage.setBaseImageName(imageUploadDTO.getBaseImageName());
            transformerImage.setBaseImageType(imageUploadDTO.getBaseImageType());
            transformerImage.setUploadedBy(imageUploadDTO.getAdminUserId());
            transformerImage.setBaseImageUploadedAt(ZonedDateTime.now());
        }
        
        TransformerImage savedImage = transformerImageRepository.save(transformerImage);
        return TransformerImageMapper.toImageUploadResponseDTO(transformer, savedImage);
    }
    
    @Transactional(readOnly = true)
    public String getImageUrl(String transformerId, String weatherCondition) {
        // Validate transformer exists
        if (!transformerRepository.existsById(transformerId)) {
            throw new RuntimeException("Transformer not found with id: " + transformerId);
        }
        
        // Parse weather condition
        TransformerImage.WeatherCondition condition;
        try {
            condition = TransformerImage.WeatherCondition.valueOf(weatherCondition.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid weather condition: " + weatherCondition);
        }
        
        Optional<TransformerImage> image = transformerImageRepository
            .findByTransformerIdAndWeatherCondition(transformerId, condition);
        
        return image.map(TransformerImage::getBaseImageUrl).orElse(null);
    }
    
    @Transactional(readOnly = true)
    public TransformerImageInfoDTO getTransformerImagesInfo(String transformerId) {
        Optional<Transformer> optionalTransformer = transformerRepository.findById(transformerId);
        if (optionalTransformer.isEmpty()) {
            return null;
        }
        
        Transformer transformer = optionalTransformer.get();
        
        // Get all images for this transformer
        Optional<TransformerImage> sunnyImage = transformerImageRepository
            .findByTransformerIdAndWeatherCondition(transformerId, TransformerImage.WeatherCondition.SUNNY);
        Optional<TransformerImage> cloudyImage = transformerImageRepository
            .findByTransformerIdAndWeatherCondition(transformerId, TransformerImage.WeatherCondition.CLOUDY);
        Optional<TransformerImage> rainyImage = transformerImageRepository
            .findByTransformerIdAndWeatherCondition(transformerId, TransformerImage.WeatherCondition.RAINY);
        
        return TransformerImageMapper.toTransformerImageInfoDTO(
            transformer, 
            sunnyImage.orElse(null), 
            cloudyImage.orElse(null), 
            rainyImage.orElse(null)
        );
    }
    
    @Transactional
    public boolean deleteImage(String transformerId, String weatherCondition) {
        // Validate transformer exists
        if (!transformerRepository.existsById(transformerId)) {
            throw new RuntimeException("Transformer not found with id: " + transformerId);
        }
        
        // Parse weather condition
        TransformerImage.WeatherCondition condition;
        try {
            condition = TransformerImage.WeatherCondition.valueOf(weatherCondition.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid weather condition: " + weatherCondition);
        }
        
        Optional<TransformerImage> image = transformerImageRepository
            .findByTransformerIdAndWeatherCondition(transformerId, condition);
        
        if (image.isPresent()) {
            transformerImageRepository.delete(image.get());
            return true;
        }
        
        return false;
    }
    
    @Transactional(readOnly = true)
    public TransformerLastUpdatedDTO getTransformerLastUpdatedTime(String transformerId) {
        Optional<Transformer> transformerOpt = transformerRepository.findById(transformerId);
        
        if (transformerOpt.isEmpty()) {
            throw new RuntimeException("Transformer not found with id: " + transformerId);
        }
        
        Transformer transformer = transformerOpt.get();
        
        // Get the most recently uploaded image
        Optional<TransformerImage> latestImage = transformerImageRepository
            .findFirstByTransformerIdOrderByBaseImageUploadedAtDesc(transformerId);
        
        return TransformerImageMapper.toLastUpdatedDTO(transformer, latestImage.orElse(null));
    }
}