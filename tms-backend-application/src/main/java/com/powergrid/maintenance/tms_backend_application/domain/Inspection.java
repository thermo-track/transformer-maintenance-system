package com.powergrid.maintenance.tms_backend_application.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

import com.powergrid.maintenance.tms_backend_application.util.NineDigitId;

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

    @Column(name = "transformer_id", nullable = false)
    private String transformerId;

    @Column(name = "date_of_inspection", nullable = false)
    private LocalDate dateOfInspection;

    @Column(name = "time_of_inspection", nullable = false)
    private LocalTime timeOfInspection;

/*     @Column(name = "date_of_maintenance")
    private LocalDate dateOfMaintenance;

    @Column(name = "time_of_maintenance")
    private LocalTime timeOfMaintenance;

    @Column(name= "status")
    private String status; */

}

