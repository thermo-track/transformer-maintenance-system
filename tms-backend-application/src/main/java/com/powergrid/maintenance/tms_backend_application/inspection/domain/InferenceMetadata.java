package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "inference_metadata")
@Data
public class InferenceMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "inspection_id", unique = true, nullable = false)
    private Long inspectionId;

    @OneToOne
    @JoinColumn(name = "inspection_id", referencedColumnName = "inspection_id", insertable = false, updatable = false)
    private Inspection inspection;

    @Column(name = "baseline_image_url", length = 500)
    private String baselineImageUrl;

    @Column(name = "maintenance_image_url", length = 500)
    private String maintenanceImageUrl;

    @Column(name = "visualization_image_url", length = 500)
    private String visualizationImageUrl;

    @Column(name = "registration_ok")
    private Boolean registrationOk;

    @Column(name = "registration_method", length = 50)
    private String registrationMethod;

    @Column(name = "registration_inliers")
    private Integer registrationInliers;

    @Column(name = "threshold_pct")
    private Double thresholdPct;

    @Column(name = "iou_thresh")
    private Double iouThresh;

    @Column(name = "conf_thresh")
    private Double confThresh;

    @Column(name = "full_json_result", columnDefinition = "TEXT")
    private String fullJsonResult;

    @Column(name = "inference_run_at")
    private LocalDateTime inferenceRunAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (inferenceRunAt == null) {
            inferenceRunAt = LocalDateTime.now();
        }
    }
}