package com.powergrid.maintenance.tms_backend_application.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for admin registration requests.
 * Admins need additional verification beyond regular users.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminRegistrationRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Employee ID is required")
    private String employeeId;

    @NotBlank(message = "Department is required")
    private String department;

    private String phoneNumber;

    @NotBlank(message = "Admin secret key is required")
    private String adminSecretKey;

    /**
     * Optional: Justification for admin access request
     */
    private String justification;
}
