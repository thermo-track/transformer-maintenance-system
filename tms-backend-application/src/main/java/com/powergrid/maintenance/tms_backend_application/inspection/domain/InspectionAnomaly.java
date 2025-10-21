package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "inspection_anomalies")
@Data
public class InspectionAnomaly {

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

    @Column(name = "area_px")
    private Integer areaPx;

    @Column(name = "fault_type", length = 100)
    private String faultType;

    @Column(name = "fault_confidence")
    private Double faultConfidence;

    @Column(name = "class_id")
    private Integer classId;

    @Column(name = "detector_box", columnDefinition = "TEXT")
    private String detectorBox;

    @Column(name = "detected_at")
    private LocalDateTime detectedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Bidirectional relationship with anomaly notes - CASCADE DELETE
    @OneToMany(mappedBy = "anomaly", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<AnomalyNote> notes;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (detectedAt == null) {
            detectedAt = LocalDateTime.now();
        }
    }
}