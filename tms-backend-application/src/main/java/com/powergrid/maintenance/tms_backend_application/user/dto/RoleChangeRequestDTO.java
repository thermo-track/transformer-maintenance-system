package com.powergrid.maintenance.tms_backend_application.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleChangeRequestDTO {
    private Long id;
    private Integer userId;
    private String username;
    private String email;
    private String fullName;
    private String department;
    private String currentRole;
    private String requestedRole;
    private String reason;
    private String status;
    private Instant requestedAt;
    private Instant reviewedAt;
    private String reviewedByUsername;
    private String reviewComment;
}
