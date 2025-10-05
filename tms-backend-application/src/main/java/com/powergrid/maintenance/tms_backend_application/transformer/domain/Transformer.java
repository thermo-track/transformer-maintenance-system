package com.powergrid.maintenance.tms_backend_application.transformer.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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