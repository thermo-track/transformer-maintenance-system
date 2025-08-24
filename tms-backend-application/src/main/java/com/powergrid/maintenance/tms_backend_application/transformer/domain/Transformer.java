package com.powergrid.maintenance.tms_backend_application.transformer.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Entity
@Table(
  name = "transformers",
  indexes = { @Index(name = "ux_transformer_no", columnList = "transformer_no", unique = true) }
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


    // Helper methods for location
    public boolean hasLocation() {
        return latitude != null && longitude != null;
    }

    public void setLocation(BigDecimal latitude, BigDecimal longitude, String address) {
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.locationSetAt = Instant.now();
    }

   // Rainy weather image fields
   @Lob
   @Basic(fetch = FetchType.LAZY)
   @Column(name = "rainy_image_data")
   private byte[] rainyImageData;

   @Column(name = "rainy_image_name")
   private String rainyImageName;

   @Column(name = "rainy_image_type")
   private String rainyImageType;

   @Column(name = "rainy_image_uploaded_by", length = 64)
   private String rainyImageUploadedBy;

   @Column(name = "rainy_image_uploaded_at")
   private Instant rainyImageUploadedAt;

   // Sunny weather image fields
   @Lob
   @Basic(fetch = FetchType.LAZY)
   @Column(name = "sunny_image_data")
   private byte[] sunnyImageData;

   @Column(name = "sunny_image_name")
   private String sunnyImageName;

   @Column(name = "sunny_image_type")
   private String sunnyImageType;

   @Column(name = "sunny_image_uploaded_by", length = 64)
   private String sunnyImageUploadedBy;

   @Column(name = "sunny_image_uploaded_at")
   private Instant sunnyImageUploadedAt;

   // Cloudy weather image fields
   @Lob
   @Basic(fetch = FetchType.LAZY)
   @Column(name = "cloudy_image_data")
   private byte[] cloudyImageData;

   @Column(name = "cloudy_image_name")
   private String cloudyImageName;

   @Column(name = "cloudy_image_type")
   private String cloudyImageType;

   @Column(name = "cloudy_image_uploaded_by", length = 64)
   private String cloudyImageUploadedBy;

   @Column(name = "cloudy_image_uploaded_at")
   private Instant cloudyImageUploadedAt;
}