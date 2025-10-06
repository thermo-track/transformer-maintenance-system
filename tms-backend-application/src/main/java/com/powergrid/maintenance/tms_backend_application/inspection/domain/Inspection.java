package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.CascadeType;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.persistence.ForeignKey;

import java.time.ZonedDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;

import lombok.Data;

@Data
@Entity
@Table(name = "inspections")
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "inspection_seq")
    @SequenceGenerator(
        name = "inspection_seq", 
        sequenceName = "inspection_id_sequence", 
        initialValue = 100000001, 
        allocationSize = 1
    )
    @Column(name = "inspection_id")
    private Long inspectionIdNumeric;

    @Column(name = "branch", nullable = false)
    private String branch;

    @Column(name = "inspection_timestamp", nullable = false)
    private ZonedDateTime inspectionTimestamp;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "environmental_condition")
    private String environmentalCondition;

    // --- Cloudinary image metadata ---
    @Column(name = "cloud_image_url")
    private String cloudImageUrl;

    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    @Column(name = "cloud_image_name")
    private String cloudImageName;

    @Column(name = "cloud_image_type")
    private String cloudImageType;

    @Column(name = "cloud_uploaded_at")
    private ZonedDateTime cloudUploadedAt;

    // Fixed relationship - now properly manages the transformer_no column
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "transformer_no",
        referencedColumnName = "transformer_no",
        nullable = false,
        foreignKey = @ForeignKey(name = "fk_inspections_transformer_no")
    )
    
    @JsonBackReference
    private Transformer transformer;

    // Bidirectional relationship with inspection anomalies - CASCADE DELETE
    @OneToMany(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<InspectionAnomaly> anomalies;

    // Bidirectional relationship with inference metadata - CASCADE DELETE
    @OneToOne(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private InferenceMetadata inferenceMetadata;

    // Transient field to provide formatted string ID for API responses
    @Transient
    public String getInspectionId() {
        return inspectionIdNumeric != null ? String.format("%09d", inspectionIdNumeric) : null;
    }

    // Setter for string ID (useful for API operations)
    @Transient
    public void setInspectionId(String inspectionId) {
        if (inspectionId != null) {
            try {
                this.inspectionIdNumeric = Long.parseLong(inspectionId);
            } catch (NumberFormatException e) {
                // Handle invalid format if needed
                throw new IllegalArgumentException("Invalid inspection ID format: " + inspectionId);
            }
        } else {
            this.inspectionIdNumeric = null;
        }
    }

    public boolean hasCloudImage() {
        return cloudImageUrl != null && !cloudImageUrl.isEmpty();
    }

    // Helper method to get transformer number when needed
    public String getTransformerNo() {
        return transformer != null ? transformer.getTransformerNo() : null;
    }

    // Helper method to set transformer by transformer number (useful for API operations)
    public void setTransformerNo(String transformerNo) {
        if (transformerNo != null) {
            Transformer t = new Transformer();
            t.setTransformerNo(transformerNo);
            this.transformer = t;
        } else {
            this.transformer = null;
        }
    }

    // Important: Override equals and hashCode for proper collection handling
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Inspection)) return false;
        Inspection that = (Inspection) o;
        return inspectionIdNumeric != null && inspectionIdNumeric.equals(that.inspectionIdNumeric);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}