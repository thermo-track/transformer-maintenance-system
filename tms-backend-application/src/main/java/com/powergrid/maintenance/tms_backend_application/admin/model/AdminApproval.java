package com.powergrid.maintenance.tms_backend_application.admin.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Entity to track admin approval requests.
 * Admins need approval before their accounts are activated with ROLE_ADMIN.
 */
@Entity
@Table(name = "admin_approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Integer userId;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String employeeId;

    @Column(nullable = false)
    private String department;

    @Column(length = 1000)
    private String justification;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "approved_by")
    private String approvedBy; // Username of the super admin who approved

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ApprovalStatus {
        PENDING,    // Waiting for approval
        APPROVED,   // Approved and user upgraded to admin
        REJECTED    // Rejected with reason
    }
}
