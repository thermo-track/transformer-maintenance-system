package com.powergrid.maintenance.tms_backend_application.admin.service;

import com.powergrid.maintenance.tms_backend_application.admin.dto.AdminRegistrationRequest;
import com.powergrid.maintenance.tms_backend_application.admin.model.AdminApproval;
import com.powergrid.maintenance.tms_backend_application.admin.repository.AdminApprovalRepository;
import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.powergrid.maintenance.tms_backend_application.user.repository.UserRepository;
import com.powergrid.maintenance.tms_backend_application.user.service.EmailService;
import com.powergrid.maintenance.tms_backend_application.user.service.OtpService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for admin-specific operations including admin registration and approval.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final AdminApprovalRepository adminApprovalRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final EmailService emailService;

    /**
     * Secret key for admin registration (configured in application.properties).
     * In production, this should be a strong, randomly generated key.
     */
    @Value("${app.admin.secret-key:CHANGE_ME_IN_PRODUCTION}")
    private String adminSecretKey;

    /**
     * Whether admin auto-approval is enabled.
     * If false, admins need manual approval from existing super-admin.
     */
    @Value("${app.admin.auto-approve:false}")
    private boolean autoApprove;

    /**
     * Register a new admin user.
     * 1. Verify admin secret key
     * 2. Create user account with ROLE_USER (temporary)
     * 3. Send email verification OTP
     * 4. Create admin approval request
     * 5. If auto-approve enabled, upgrade immediately
     * 
     * @param request Admin registration request
     * @return The created user
     */
    @Transactional
    public User registerAdmin(AdminRegistrationRequest request) {
        // Step 1: Verify admin secret key
        if (!adminSecretKey.equals(request.getAdminSecretKey())) {
            throw new IllegalArgumentException("Invalid admin secret key");
        }

        // Step 2: Check if user already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // Check if already has pending admin approval
        if (adminApprovalRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Admin approval request already exists for this email");
        }

        // Step 3: Create user account (initially with ROLE_USER)
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setEmployeeId(request.getEmployeeId());
        user.setDepartment(request.getDepartment());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole("ROLE_USER"); // Temporary role until approved
        user.setEnabled(false); // Disabled until email verification
        user.setEmailVerified(false);

        User savedUser = userRepository.save(user);
        log.info("Admin candidate user created: {}", savedUser.getUsername());

        // Step 4: Send email verification OTP
        otpService.generateAndSendOtp(user.getEmail());

        // Step 5: Create admin approval request
        AdminApproval approval = new AdminApproval();
        approval.setUserId(savedUser.getId());
        approval.setUsername(savedUser.getUsername());
        approval.setEmail(savedUser.getEmail());
        approval.setEmployeeId(request.getEmployeeId());
        approval.setDepartment(request.getDepartment());
        approval.setJustification(request.getJustification());
        approval.setStatus(AdminApproval.ApprovalStatus.PENDING);

        adminApprovalRepository.save(approval);
        log.info("Admin approval request created for: {}", savedUser.getUsername());

        // Step 6: If auto-approve is enabled, upgrade immediately after email verification
        if (autoApprove) {
            log.info("Auto-approval is enabled. Admin will be upgraded after email verification.");
            // Note: Actual upgrade happens in verifyEmailForAdmin method
        } else {
            log.info("Manual approval required for admin: {}", savedUser.getUsername());
            // Notify existing admins about the new request
            notifyExistingAdmins(savedUser.getUsername(), savedUser.getEmail(), request.getJustification());
        }

        return savedUser;
    }

    /**
     * Verify email for admin user and upgrade to ROLE_ADMIN if auto-approved.
     */
    @Transactional
    public boolean verifyEmailForAdmin(String email, String otpCode) {
        // Verify OTP
        boolean otpValid = otpService.verifyOtp(email, otpCode);
        
        if (!otpValid) {
            return false;
        }

        // Find user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        // Verify email
        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);

        // If auto-approve is enabled, upgrade to admin immediately
        AdminApproval approval = adminApprovalRepository.findByEmail(email)
                .orElse(null);

        if (approval != null && autoApprove) {
            user.setRole("ROLE_ADMIN");
            userRepository.save(user);

            approval.setStatus(AdminApproval.ApprovalStatus.APPROVED);
            approval.setApprovedBy("AUTO_APPROVAL");
            approval.setApprovedAt(LocalDateTime.now());
            adminApprovalRepository.save(approval);

            log.info("Admin user auto-approved and upgraded: {}", user.getUsername());
            
            // Send admin welcome email
            emailService.sendAdminWelcomeEmail(email, user.getUsername());
        } else {
            log.info("Email verified for admin candidate: {}. Awaiting manual approval.", user.getUsername());
            // Send email informing user they're pending approval
            emailService.sendPendingApprovalEmail(email, user.getUsername());
        }

        // Clean up OTP
        otpService.deleteOtp(email);

        return true;
    }

    /**
     * Get all pending admin approval requests.
     * Only accessible by existing admins.
     */
    public List<AdminApproval> getPendingApprovals() {
        return adminApprovalRepository.findByStatus(AdminApproval.ApprovalStatus.PENDING);
    }

    /**
     * Approve an admin request.
     * Upgrades user to ROLE_ADMIN.
     */
    @Transactional
    public void approveAdmin(Long approvalId, String approverUsername) {
        AdminApproval approval = adminApprovalRepository.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("Approval request not found"));

        if (approval.getStatus() != AdminApproval.ApprovalStatus.PENDING) {
            throw new IllegalStateException("Approval request is not pending");
        }

        // Find and upgrade user
        User user = userRepository.findById(approval.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setRole("ROLE_ADMIN");
        userRepository.save(user);

        // Update approval status
        approval.setStatus(AdminApproval.ApprovalStatus.APPROVED);
        approval.setApprovedBy(approverUsername);
        approval.setApprovedAt(LocalDateTime.now());
        adminApprovalRepository.save(approval);

        log.info("Admin approved: {} by {}", user.getUsername(), approverUsername);

        // Send admin welcome email
        emailService.sendAdminWelcomeEmail(user.getEmail(), user.getUsername());
    }

    /**
     * Reject an admin request.
     */
    @Transactional
    public void rejectAdmin(Long approvalId, String rejectionReason, String rejectorUsername) {
        AdminApproval approval = adminApprovalRepository.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("Approval request not found"));

        if (approval.getStatus() != AdminApproval.ApprovalStatus.PENDING) {
            throw new IllegalStateException("Approval request is not pending");
        }

        approval.setStatus(AdminApproval.ApprovalStatus.REJECTED);
        approval.setRejectionReason(rejectionReason);
        approval.setApprovedBy(rejectorUsername); // Track who rejected
        approval.setApprovedAt(LocalDateTime.now());
        adminApprovalRepository.save(approval);

        log.info("Admin request rejected for: {} by {}", approval.getUsername(), rejectorUsername);

        // Send rejection email to user
        User user = userRepository.findById(approval.getUserId())
                .orElse(null);
        if (user != null) {
            emailService.sendAdminRejectionEmail(user.getEmail(), user.getUsername(), rejectionReason);
        }
    }

    /**
     * Notify all existing admins about a new admin request.
     */
    private void notifyExistingAdmins(String candidateUsername, String candidateEmail, String justification) {
        try {
            // Find all existing admins
            List<User> admins = userRepository.findAll().stream()
                    .filter(user -> "ROLE_ADMIN".equals(user.getRole()))
                    .toList();
            
            if (admins.isEmpty()) {
                log.warn("No existing admins found to notify about new admin request from: {}", candidateUsername);
                return;
            }
            
            // Send notification to each admin
            for (User admin : admins) {
                emailService.sendAdminRequestNotification(
                    admin.getEmail(), 
                    candidateUsername, 
                    candidateEmail, 
                    justification
                );
            }
            
            log.info("Notified {} admin(s) about new admin request from: {}", admins.size(), candidateUsername);
        } catch (Exception e) {
            log.error("Failed to notify admins about new request: {}", e.getMessage());
            // Don't throw exception - approval request was already saved
        }
    }

    /**
     * Check if a user is an admin.
     */
    public boolean isAdmin(String username) {
        User user = userRepository.findByUsername(username)
                .orElse(null);
        return user != null && "ROLE_ADMIN".equals(user.getRole());
    }
}
