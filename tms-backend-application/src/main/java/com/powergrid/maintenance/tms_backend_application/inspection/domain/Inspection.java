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
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;

import lombok.Data;

@Data
@Entity
@Table(name = "inspections")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
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

    // --- Digital Form Data (stored as JSON/TEXT) ---
    @Column(name = "inspected_by")
    private String inspectedBy;

    @Column(name = "baseline_right")
    private String baselineRight;

    @Column(name = "baseline_left")
    private String baselineLeft;

    @Column(name = "baseline_front")
    private String baselineFront;

    @Column(name = "last_month_kva")
    private String lastMonthKVA;

    @Column(name = "last_month_date")
    private String lastMonthDate;

    @Column(name = "last_month_time")
    private String lastMonthTime;

    @Column(name = "current_month_kva")
    private String currentMonthKVA;

    @Column(name = "meter_serial")
    private String meterSerial;

    @Column(name = "meter_ct_ratio")
    private String meterCTRatio;

    @Column(name = "meter_make")
    private String meterMake;

    @Column(name = "after_thermal_date")
    private String afterThermalDate;

    @Column(name = "after_thermal_time")
    private String afterThermalTime;

    // --- First Inspection Voltage Readings ---
    @Column(name = "first_voltage_r")
    private String firstVoltageR;

    @Column(name = "first_voltage_y")
    private String firstVoltageY;

    @Column(name = "first_voltage_b")
    private String firstVoltageB;

    @Column(name = "first_current_r")
    private String firstCurrentR;

    @Column(name = "first_current_y")
    private String firstCurrentY;

    @Column(name = "first_current_b")
    private String firstCurrentB;

    // --- Second Inspection Voltage Readings ---
    @Column(name = "second_voltage_r")
    private String secondVoltageR;

    @Column(name = "second_voltage_y")
    private String secondVoltageY;

    @Column(name = "second_voltage_b")
    private String secondVoltageB;

    @Column(name = "second_current_r")
    private String secondCurrentR;

    @Column(name = "second_current_y")
    private String secondCurrentY;

    @Column(name = "second_current_b")
    private String secondCurrentB;

    // --- Work Data Sheet Fields ---
    // Time & Supervision Section
    @Column(name = "start_time")
    private String startTime;

    @Column(name = "completion_time")
    private String completionTime;

    @Column(name = "supervised_by")
    private String supervisedBy;

    // Gang Composition Section
    @Column(name = "tech_i")
    private String techI;

    @Column(name = "tech_ii")
    private String techII;

    @Column(name = "tech_iii")
    private String techIII;

    @Column(name = "helpers")
    private String helpers;

    // Inspection & Rectification Log Section
    @Column(name = "inspected_by_wds")
    private String inspectedByWds;

    @Column(name = "inspected_date")
    private String inspectedDate;

    @Column(name = "rectified_by")
    private String rectifiedBy;

    @Column(name = "rectified_date")
    private String rectifiedDate;

    @Column(name = "re_inspected_by")
    private String reInspectedBy;

    @Column(name = "re_inspected_date")
    private String reInspectedDate;

    @Column(name = "css_person")
    private String cssPerson;

    @Column(name = "css_date")
    private String cssDate;

    // Final Verification Section
    @Column(name = "final_css_person")
    private String finalCssPerson;

    @Column(name = "final_css_date")
    private String finalCssDate;

    @Column(name = "digital_form_data", columnDefinition = "TEXT")
    private String digitalFormData; // JSON string for checklist only

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

    // Store transformer_no directly to avoid lazy loading
    @Column(name = "transformer_no", insertable = false, updatable = false)
    private String transformerNo;

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

    // Lombok will generate getTransformerNo() and setTransformerNo() for the field
    // No need for helper methods that access the transformer relationship

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