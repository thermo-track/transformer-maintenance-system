package com.powergrid.maintenance.tms_backend_application.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * DTO for updating user profile information
 */
@Data
public class UpdateUserProfileRequest {
    
    @Size(max = 50, message = "Employee ID cannot exceed 50 characters")
    private String employeeId;
    
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;
    
    @Size(max = 50, message = "Department cannot exceed 50 characters")
    private String department;
    
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String phoneNumber;
    
    @Size(max = 500, message = "Profile photo URL cannot exceed 500 characters")
    private String profilePhotoUrl;
}
