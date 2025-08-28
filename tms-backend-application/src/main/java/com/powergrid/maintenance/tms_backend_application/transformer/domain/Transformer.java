package com.powergrid.maintenance.tms_backend_application.transformer.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

// Import the Inspection entity
import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;

@Data
@Entity
@Table(
    name = "transformers",
    indexes = {
        @Index(name = "ux_transformer_no", columnList = "transformer_no", unique = true)
    }
)
public class Transformer {
    
    @Id
    @GeneratedValue
    @UuidGenerator
    private String id;
    
    @Column(name = "transformer_no", nullable = false, unique = true, length = 64)
    private String transformerNo;
    
    @Column(name = "pole_no", nullable = false, length = 64)
    private String poleNo;
    
    @Column(nullable = false, length = 32)
    private String region;
    
    @Column(nullable = false, length = 32)
    private String type;
    
    @Column(name = "location_details", length = 1024)
    private String locationDetails;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();
    
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();
    
    // Location fields
    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;
    
    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;
    
    @Column(name = "address", length = 1024)
    private String address;
    
    @Column(name = "location_set_at")
    private Instant locationSetAt;
    
    // Properly mapped bidirectional relationship with transformer images
    @OneToMany(
        mappedBy = "transformer",
        cascade = CascadeType.ALL,
        fetch = FetchType.LAZY,
        orphanRemoval = true
    )
    private List<TransformerImage> images = new ArrayList<>();
    
    // Add bidirectional relationship with inspections
    @OneToMany(
        mappedBy = "transformer",
        cascade = CascadeType.ALL,
        fetch = FetchType.LAZY,
        orphanRemoval = true
    )
    private List<Inspection> inspections = new ArrayList<>();
    
    @PreUpdate
    public void touch() {
        this.updatedAt = Instant.now();
    }
    
    public boolean hasLocation() {
        return latitude != null && longitude != null;
    }
    
    public void setLocation(BigDecimal latitude, BigDecimal longitude, String address) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.locationSetAt = Instant.now();
    }
    
    // Helper methods for images
    public TransformerImage getImageByWeather(TransformerImage.WeatherCondition weather) {
        return images.stream()
            .filter(img -> img.getWeatherCondition() == weather)
            .findFirst()
            .orElse(null);
    }
    
    public boolean hasImageForWeather(TransformerImage.WeatherCondition weather) {
        return getImageByWeather(weather) != null;
    }
    
    // Convenience methods for managing the bidirectional relationship with images
    public void addImage(TransformerImage image) {
        if (image != null) {
            images.add(image);
            image.setTransformer(this);
        }
    }
    
    public void removeImage(TransformerImage image) {
        if (image != null) {
            images.remove(image);
            image.setTransformer(null);
        }
    }
    
    public void clearImages() {
        images.forEach(image -> image.setTransformer(null));
        images.clear();
    }
    
    // Convenience methods for managing the bidirectional relationship with inspections
    public void addInspection(Inspection inspection) {
        if (inspection != null) {
            inspections.add(inspection);
            inspection.setTransformer(this);
        }
    }
    
    public void removeInspection(Inspection inspection) {
        if (inspection != null) {
            inspections.remove(inspection);
            inspection.setTransformer(null);
        }
    }
    
    public void clearInspections() {
        inspections.forEach(inspection -> inspection.setTransformer(null));
        inspections.clear();
    }
    
    // Important: Override equals and hashCode for proper collection handling
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Transformer)) return false;
        Transformer that = (Transformer) o;
        return id != null && id.equals(that.id);
    }
    
    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}