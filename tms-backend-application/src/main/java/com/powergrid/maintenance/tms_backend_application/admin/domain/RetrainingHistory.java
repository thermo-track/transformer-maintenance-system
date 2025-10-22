package com.powergrid.maintenance.tms_backend_application.admin.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entity representing a model retraining session
 */
@Entity
@Table(name = "retraining_history")
@Data
public class RetrainingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id", unique = true, nullable = false, length = 100)
    private String runId;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // PENDING, RUNNING, COMPLETED, FAILED

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "images_count")
    private Integer imagesCount;

    @Column(name = "feedback_samples")
    private Integer feedbackSamples;

    @Column(name = "replay_samples")
    private Integer replaySamples;

    @Column(name = "actions_included")
    private Integer actionsIncluded;

    @Column(name = "triggered_by", nullable = false, length = 50)
    private String triggeredBy;

    @Column(name = "weights_path", columnDefinition = "TEXT")
    private String weightsPath;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metrics", columnDefinition = "jsonb")
    private Map<String, Object> metrics;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "hyperparameters", columnDefinition = "jsonb")
    private Map<String, Object> hyperparameters;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "python_response", columnDefinition = "jsonb")
    private Map<String, Object> pythonResponse;

    @PrePersist
    protected void onCreate() {
        if (startedAt == null) {
            startedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
    }
}
