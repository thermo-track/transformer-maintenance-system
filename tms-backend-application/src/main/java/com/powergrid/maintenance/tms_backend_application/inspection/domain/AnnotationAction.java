package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import com.powergrid.maintenance.tms_backend_application.inspection.dto.BBoxData;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ClassificationData;
import com.powergrid.maintenance.tms_backend_application.inspection.model.ActionType;
import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entity representing an annotation action (audit trail)
 */
@Entity
@Table(name = "annotation_actions")
@Data
public class AnnotationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anomaly_id", nullable = false)
    private Long anomalyId;

    @ManyToOne
    @JoinColumn(name = "anomaly_id", insertable = false, updatable = false)
    @JsonIgnore
    private InspectionAnomaly anomaly;

    @Column(name = "inspection_id", nullable = false)
    private Long inspectionId;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @ManyToOne
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    @JsonIgnore
    private User user;

    @Column(name = "username", nullable = false, length = 50)
    private String username;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 20)
    private ActionType actionType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "previous_bbox", columnDefinition = "jsonb")
    private BBoxData previousBbox;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_bbox", columnDefinition = "jsonb")
    private BBoxData newBbox;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "previous_classification", columnDefinition = "jsonb")
    private ClassificationData previousClassification;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_classification", columnDefinition = "jsonb")
    private ClassificationData newClassification;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "action_timestamp")
    private LocalDateTime actionTimestamp;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "client_metadata", columnDefinition = "jsonb")
    private Map<String, Object> clientMetadata;

    @PrePersist
    protected void onCreate() {
        if (actionTimestamp == null) {
            actionTimestamp = LocalDateTime.now();
        }
    }
}
