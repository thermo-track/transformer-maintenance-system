package com.powergrid.maintenance.tms_backend_application.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for login response containing authentication result and user info.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private boolean success;
    private String message;
    private String username;
    private String role;

    public LoginResponse(boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}
