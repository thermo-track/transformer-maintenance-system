package com.powergrid.maintenance.tms_backend_application.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Entity representing a user's request to change their role (e.g., to MAINTENANCE_ENGINEER)
 */
@Entity
@Table(name = "role_change_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleChangeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String requestedRole;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false, length = 20)
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED

    @Column
    private Instant requestedAt;

    @Column
    private Instant reviewedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(length = 500)
    private String reviewComment;

    @PrePersist
    protected void onCreate() {
        requestedAt = Instant.now();
    }
}
