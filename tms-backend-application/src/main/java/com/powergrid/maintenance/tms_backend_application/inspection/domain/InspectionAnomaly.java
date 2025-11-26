package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.powergrid.maintenance.tms_backend_application.inspection.model.AnomalySource;

@Entity
@Table(name = "inspection_anomalies")
@Data
public class InspectionAnomaly {
    
    // Alias for anomalyId
    @JsonProperty("anomalyId")
    public Long getAnomalyId() {
        return this.id;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "inspection_id", nullable = false)
    private Long inspectionId;

    @ManyToOne
    @JoinColumn(name = "inspection_id", referencedColumnName = "inspection_id", insertable = false, updatable = false)
    @JsonIgnore
    private Inspection inspection;

    @Column(name = "bbox_x")
    private Integer bboxX;

    @Column(name = "bbox_y")
    private Integer bboxY;

    @Column(name = "bbox_width")
    private Integer bboxWidth;

    @Column(name = "bbox_height")
    private Integer bboxHeight;

    @Column(name = "centroid_x")
    private Double centroidX;

    @Column(name = "centroid_y")
    private Double centroidY;
    
    // Aliases for xCoordinate and yCoordinate (frontend compatibility)
    @JsonProperty("xCoordinate")
    public Double getXCoordinate() {
        return this.centroidX;
    }
    
    @JsonProperty("yCoordinate")
    public Double getYCoordinate() {
        return this.centroidY;
    }

    @Column(name = "area_px")
    private Integer areaPx;

    @Column(name = "fault_type", length = 100)
    private String faultType;
    
    // Alias for anomalyType (frontend compatibility)
    @JsonProperty("anomalyType")
    public String getAnomalyType() {
        return this.faultType;
    }

    @Column(name = "fault_confidence")
    private Double faultConfidence;
    
    // Alias for confidence (frontend compatibility)
    @JsonProperty("confidence")
    public Double getConfidence() {
        return this.faultConfidence;
    }

    @Column(name = "class_id")
    private Integer classId;

    @Column(name = "detected_at")
    private LocalDateTime detectedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // NEW FIELDS FOR ANNOTATION FEEDBACK
    @Enumerated(EnumType.STRING)
    @Column(name = "source", length = 20)
    private AnomalySource source = AnomalySource.AI_GENERATED;
    
    // Alias for isAiDetection (frontend compatibility)
    @JsonProperty("isAiDetection")
    public boolean getIsAiDetection() {
        return this.source == AnomalySource.AI_GENERATED;
    }

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "superseded_by")
    private Long supersededBy;

    @Column(name = "superseded_at")
    private LocalDateTime supersededAt;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    // Bidirectional relationship with anomaly notes - CASCADE DELETE
    @OneToMany(mappedBy = "anomaly", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<AnomalyNote> notes;
    
    // Provide description from most recent note (frontend compatibility)
    @JsonProperty("description")
    public String getDescription() {
        if (notes == null || notes.isEmpty()) {
            return String.format("%s detected at (%.0f, %.0f)", 
                faultType != null ? faultType : "Anomaly", 
                centroidX != null ? centroidX : 0.0, 
                centroidY != null ? centroidY : 0.0);
        }
        // Return most recent note
        return notes.stream()
            .max((n1, n2) -> n1.getCreatedAt().compareTo(n2.getCreatedAt()))
            .map(AnomalyNote::getNote)
            .orElse("No description available");
    }

    // Bidirectional relationship with annotation actions - CASCADE DELETE
    @OneToMany(mappedBy = "anomaly", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<AnnotationAction> actions;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (detectedAt == null) {
            detectedAt = LocalDateTime.now();
        }
        if (source == null) {
            source = AnomalySource.AI_GENERATED;
        }
        if (isActive == null) {
            isActive = true;
        }
    }
}