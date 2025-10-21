package com.powergrid.maintenance.tms_backend_application.inspection.model;

/**
 * Enum representing types of annotation actions for audit trail
 */
public enum ActionType {
    /**
     * New anomaly annotation created by user
     */
    CREATED,
    
    /**
     * Existing anomaly annotation edited (bbox or classification changed)
     */
    EDITED,
    
    /**
     * Anomaly annotation deleted (soft delete)
     */
    DELETED,
    
    /**
     * AI detection approved/accepted by user
     */
    APPROVED,
    
    /**
     * AI detection rejected by user
     */
    REJECTED,
    
    /**
     * Comment added to anomaly
     */
    COMMENTED
}
