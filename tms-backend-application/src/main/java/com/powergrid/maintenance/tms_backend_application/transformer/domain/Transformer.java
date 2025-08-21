package com.powergrid.maintenance.tms_backend_application.transformer.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;

@Entity
@Table(
  name = "transformer",
  indexes = { @Index(name = "ux_transformer_no", columnList = "transformer_no", unique = true) }
)
public class Transformer {

  // public enum Region { KANDY, COLOMBO, JAFFNA, TRINCOMALEE, ANURADHAPURA, BATTICALOA, NEGOMBO, GALLE }
  // public enum Type { BULK, DISTRIBUTION }

  @Id @GeneratedValue @UuidGenerator
  private String id;

  @Column(name = "transformer_no", nullable = false, unique = true, length = 64)
  private String transformerNo;

  @Column(name = "pole_no", nullable = false, length = 64)
  private String poleNo;

  // @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  // private Region region;
  private String region;

  // @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 32)
  // private Type type;
  private String type;

  @Column(name = "location_details", length = 1024)
  private String locationDetails;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt = Instant.now();

  @PreUpdate
  public void touch() { this.updatedAt = Instant.now(); }

  // --- getters & setters ---
  public String getId() { return id; }
  public String getTransformerNo() { return transformerNo; }
  public void setTransformerNo(String transformerNo) { this.transformerNo = transformerNo; }
  public String getPoleNo() { return poleNo; }
  public void setPoleNo(String poleNo) { this.poleNo = poleNo; }
  // public Region getRegion() { return region; }
  // public void setRegion(Region region) { this.region = region; }
  // public Type getType() { return type; }
  // public void setType(Type type) { this.type = type; }
  
  public String getLocationDetails() { return locationDetails; }
  public void setLocationDetails(String locationDetails) { this.locationDetails = locationDetails; }
  public String getRegion() {
    return region;
  }

  public void setRegion(String region) {
    this.region = region;
  }

  public String getType() {
    return type;
  }

  public void setType(String type) {
    this.type = type;
  }

  public Instant getCreatedAt() { return createdAt; }
  public Instant getUpdatedAt() { return updatedAt; }
}
