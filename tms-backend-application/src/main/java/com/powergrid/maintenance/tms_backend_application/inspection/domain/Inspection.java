package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

import com.powergrid.maintenance.tms_backend_application.inspection.util.NineDigitId;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;

import lombok.Data;

@Data
@Entity
@Table(name = "inspections")
public class Inspection {
    @Id
    @GeneratedValue(generator = "custom-id")
    @NineDigitId 
    @Column(name = "inspection_id", length = 9)
    private String inspectionId;

    @Column(name = "branch", nullable = false)
    private String branch;

    @Column(name = "transformer_no", nullable = false, length = 64)
    private String transformerNo;

    @Column(name = "date_of_inspection", nullable = false)
    private LocalDate dateOfInspection;

    @Column(name = "time_of_inspection", nullable = false)
    private LocalTime timeOfInspection;

    @Lob
    @Column(name = "image_data")
    private byte[] imageData;
    
    @Column(name = "image_name")
    private String imageName;
    
    @Column(name = "image_type")
    private String imageType;

    @Column(name = "environmental_condition")
    private String environmentalCondition;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "transformer_no",
        referencedColumnName = "transformer_no",
        insertable = false, updatable = false,
        foreignKey = @ForeignKey(name = "fk_inspections_transformer_no")
    )
    private Transformer transformer;


/*     @Column(name = "date_of_maintenance")
    private LocalDate dateOfMaintenance;

    @Column(name = "time_of_maintenance")
    private LocalTime timeOfMaintenance;

    @Column(name= "status")
    private String status; */

}

