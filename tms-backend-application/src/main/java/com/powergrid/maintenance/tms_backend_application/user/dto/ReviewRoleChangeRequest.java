package com.powergrid.maintenance.tms_backend_application.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRoleChangeRequest {
    private String status; // APPROVED or REJECTED
    private String reviewComment;
}
