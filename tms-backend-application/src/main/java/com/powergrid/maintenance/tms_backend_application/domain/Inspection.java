package com.powergrid.maintenance.tms_backend_application.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.Data;


@Data
@Entity
public class Inspection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer InspectionId;
    private String branch;
    private String transformerId;
    private LocalDate dateOfInspection;
    private LocalTime time;
}

