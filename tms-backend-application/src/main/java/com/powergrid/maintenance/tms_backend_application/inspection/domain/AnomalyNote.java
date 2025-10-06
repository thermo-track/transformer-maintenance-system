package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "anomaly_notes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "anomaly_id", nullable = false)
    private Long anomalyId;

    @ManyToOne
    @JoinColumn(name = "anomaly_id", referencedColumnName = "id", insertable = false, updatable = false)
    @JsonIgnore
    private InspectionAnomaly anomaly;

    @Column(name = "note", nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}