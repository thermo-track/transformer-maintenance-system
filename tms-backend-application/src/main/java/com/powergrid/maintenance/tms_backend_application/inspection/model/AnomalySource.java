package com.powergrid.maintenance.tms_backend_application.inspection.model;

/**
 * Enum representing the source of an anomaly detection
 */
public enum AnomalySource {
    /**
     * Anomaly detected by AI inference pipeline
     */
    AI_GENERATED,
    
    /**
     * Anomaly manually added by user
     */
    USER_ADDED
}
