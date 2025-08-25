package com.powergrid.maintenance.tms_backend_application.inspection.enums;

public enum InspectionStatus {
    IN_PROGRESS("IN_PROGRESS"),
    COMPLETED("COMPLETED"),
    PENDING("PENDING"),
    SCHEDULED("SCHEDULED");
    
    private final String value;
    
    InspectionStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    public static InspectionStatus fromValue(String value) {
        for (InspectionStatus status : values()) {
            if (status.value.equals(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Invalid status value: " + value);
    }
}