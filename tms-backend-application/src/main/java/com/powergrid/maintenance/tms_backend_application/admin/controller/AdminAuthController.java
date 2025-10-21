package com.powergrid.maintenance.tms_backend_application.admin.controller;

import com.powergrid.maintenance.tms_backend_application.admin.dto.AdminRegistrationRequest;
import com.powergrid.maintenance.tms_backend_application.admin.model.AdminApproval;
import com.powergrid.maintenance.tms_backend_application.admin.service.AdminService;
import com.powergrid.maintenance.tms_backend_application.user.dto.VerifyOtpRequest;
import com.powergrid.maintenance.tms_backend_application.user.model.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller for admin authentication and approval operations.
 */
@RestController
@RequestMapping("/api/admin/auth")
@RequiredArgsConstructor
@Slf4j
public class AdminAuthController {

    private final AdminService adminService;

    /**
     * Register a new admin user.
     * Requires admin secret key for verification.
     * POST /api/admin/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerAdmin(@Valid @RequestBody AdminRegistrationRequest request) {
        try {
            User user = adminService.registerAdmin(request);

            log.info("Admin registration initiated: {}", user.getUsername());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Admin registration successful. Please check your email for verification code.");
            response.put("email", user.getEmail());
            response.put("username", user.getUsername());
            response.put("requiresApproval", true);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("Admin registration failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Admin registration error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Registration failed: " + e.getMessage()
            ));
        }
    }

    /**
     * Verify email for admin user with OTP.
     * POST /api/admin/auth/verify-otp
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyAdminOtp(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            boolean verified = adminService.verifyEmailForAdmin(request.getEmail(), request.getOtpCode());

            if (verified) {
                log.info("Admin email verified: {}", request.getEmail());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Email verified successfully. Your admin access is pending approval."
                ));
            } else {
                log.warn("Invalid OTP for admin email: {}", request.getEmail());
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid or expired verification code."
                ));
            }
        } catch (Exception e) {
            log.error("Admin OTP verification error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Verification failed: " + e.getMessage()
            ));
        }
    }

    /**
     * Get all pending admin approval requests.
     * Only accessible by existing admins.
     * GET /api/admin/auth/pending-approvals
     */
    @GetMapping("/pending-approvals")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getPendingApprovals() {
        try {
            List<AdminApproval> approvals = adminService.getPendingApprovals();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "approvals", approvals
            ));
        } catch (Exception e) {
            log.error("Error fetching pending approvals: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Failed to fetch approvals"
            ));
        }
    }

    /**
     * Approve an admin request.
     * Only accessible by existing admins.
     * POST /api/admin/auth/approve/{approvalId}
     */
    @PostMapping("/approve/{approvalId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> approveAdmin(
            @PathVariable Long approvalId,
            Authentication authentication) {
        try {
            String approverUsername = authentication.getName();
            adminService.approveAdmin(approvalId, approverUsername);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Admin approved successfully"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Admin approval failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Admin approval error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Approval failed"
            ));
        }
    }

    /**
     * Reject an admin request.
     * Only accessible by existing admins.
     * POST /api/admin/auth/reject/{approvalId}
     */
    @PostMapping("/reject/{approvalId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> rejectAdmin(
            @PathVariable Long approvalId,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        try {
            String rejectorUsername = authentication.getName();
            String reason = request.getOrDefault("reason", "No reason provided");
            
            adminService.rejectAdmin(approvalId, reason, rejectorUsername);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Admin request rejected"
            ));
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.error("Admin rejection failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            log.error("Admin rejection error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "success", false,
                "message", "Rejection failed"
            ));
        }
    }
}
