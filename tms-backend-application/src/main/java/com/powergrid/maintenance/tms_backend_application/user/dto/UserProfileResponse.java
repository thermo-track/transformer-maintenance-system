package com.powergrid.maintenance.tms_backend_application.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO for user profile response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Integer id;
    private String username;
    private String email;
    private String role;
    private boolean enabled;
    private boolean emailVerified;
    private String employeeId;
    private String fullName;
    private String department;
    private String phoneNumber;
    private String profilePhotoUrl;
    private Instant createdAt;
}
