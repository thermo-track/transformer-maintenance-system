package com.powergrid.maintenance.tms_backend_application.admin.dto;

import lombok.Data;

@Data
public class RetrainingRequest {
    private Integer epochs = 10;
    private Integer feedbackReplay = 20;
    private Integer originalReplay = 100;
    private String device = "cpu"; // "cpu", "0", "0,1", etc.
    private Integer minCorrections = 20; // Minimum corrections required
    private String imageId; // Optional: specific image to train on
}
