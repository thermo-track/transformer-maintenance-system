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
    
    // Proper JPA relationship instead of String transformerId
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id", nullable = false)
    private Transformer transformer;
    
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
    
    // Helper method to get transformer ID when needed
    public String getTransformerId() {
        return transformer != null ? transformer.getId() : null;
    }
    
    // Helper method to set transformer by ID (useful for API operations)
    public void setTransformerId(String transformerId) {
        if (transformerId != null) {
            Transformer t = new Transformer();
            t.setId(transformerId);
            this.transformer = t;
        } else {
            this.transformer = null;
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
    
    // Important: Override equals and hashCode for proper collection handling
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof TransformerImage)) return false;
        TransformerImage that = (TransformerImage) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}