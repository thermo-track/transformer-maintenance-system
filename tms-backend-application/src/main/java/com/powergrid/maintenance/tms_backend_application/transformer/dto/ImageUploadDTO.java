package com.powergrid.maintenance.tms_backend_application.transformer.dto;

import org.hibernate.validator.constraints.URL;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImageUploadDTO {
    @NotBlank(message = "Weather condition is required")
    @Pattern(regexp = "^(SUNNY|CLOUDY|RAINY)$",
             flags = Pattern.Flag.CASE_INSENSITIVE,
             message = "Weather condition must be one of: SUNNY, CLOUDY, RAINY")
    private String weatherCondition;
    
    @NotBlank(message = "Admin User ID is required")
    @Size(max = 64, message = "Admin User ID cannot exceed 64 characters")
    private String adminUserId;
    
    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    
    // New fields for Cloudinary image data
    @NotBlank(message = "Image URL is required")
    @URL(message = "Invalid image URL format")
    @Size(max = 2048, message = "Image URL cannot exceed 2048 characters")
    private String baseImageUrl;
    
    @NotBlank(message = "Cloudinary public ID is required")
    @Size(max = 255, message = "Cloudinary public ID cannot exceed 255 characters")
    private String baseCloudinaryPublicId;
    
    @Size(max = 255, message = "Image name cannot exceed 255 characters")
    private String baseImageName;
    
    @Size(max = 50, message = "Image type cannot exceed 50 characters")
    private String baseImageType;
}