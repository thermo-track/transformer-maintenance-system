package com.powergrid.maintenance.tms_backend_application.transformer.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.time.ZonedDateTime;

@Data
@Entity
@Table(
    name = "transformer_images",
    indexes = {
        @Index(name = "idx_transformer_images_transformer_id", columnList = "transformer_id"),
        @Index(name = "idx_transformer_images_weather", columnList = "weather_condition"),
        @Index(name = "ux_transformer_weather", columnList = "transformer_id,weather_condition", unique = true)
    }
)
public class TransformerImage {
    
    @Id
    @GeneratedValue
    @UuidGenerator
    private String id;
    
    // Foreign key to transformer - using transformer_id (UUID) is better for referential integrity
    @Column(name = "transformer_id", nullable = false, length = 36)
    private String transformerId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "weather_condition", nullable = false, length = 20)
    private WeatherCondition weatherCondition;
    
    // Cloud storage fields with base prefix
    @Column(name = "base_image_url", nullable = false, length = 2048)
    private String baseImageUrl;
    
    @Column(name = "base_cloudinary_public_id", nullable = false, length = 255)
    private String baseCloudinaryPublicId;
    
    @Column(name = "base_image_name", length = 255)
    private String baseImageName;
    
    @Column(name = "base_image_type", length = 50)
    private String baseImageType;
    
    @Column(name = "uploaded_by", length = 64)
    private String uploadedBy;
    
    // Single timestamp for when image was uploaded (replaces both updated_at and cloud_uploaded_at)
    @Column(name = "base_image_uploaded_at", nullable = false)
    private ZonedDateTime baseImageUploadedAt;
    
    // Audit fields
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
    
    @PrePersist
    public void onCreate() {
        ZonedDateTime now = ZonedDateTime.now();
        this.createdAt = now;
        if (this.baseImageUploadedAt == null) {
            this.baseImageUploadedAt = now;
        }
    }
    
    // Weather condition enum
    public enum WeatherCondition {
        SUNNY("sunny"),
        RAINY("rainy"),
        CLOUDY("cloudy");
        
        private final String value;
        
        WeatherCondition(String value) {
            this.value = value;
        }
        
        public String getValue() {
            return value;
        }
    }
}