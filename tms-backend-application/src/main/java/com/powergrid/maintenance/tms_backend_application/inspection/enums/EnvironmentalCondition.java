package com.powergrid.maintenance.tms_backend_application.inspection.enums;

public enum EnvironmentalCondition {
    SUNNY("Sunny"),
    CLOUDY("Cloudy"),
    RAINY("Rainy");
    
    private final String displayName;
    
    EnvironmentalCondition(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
    
    // Method to get enum from string (case-insensitive)
    public static EnvironmentalCondition fromString(String condition) {
        if (condition == null) {
            return null;
        }
        
        for (EnvironmentalCondition env : EnvironmentalCondition.values()) {
            if (env.name().equalsIgnoreCase(condition) || 
                env.displayName.equalsIgnoreCase(condition)) {
                return env;
            }
        }
        throw new IllegalArgumentException("Invalid environmental condition: " + condition + 
            ". Valid values are: SUNNY, CLOUDY, RAINY");
    }
    
    // Method to validate if string is valid environmental condition
    public static boolean isValid(String condition) {
        try {
            fromString(condition);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}