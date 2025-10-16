package com.powergrid.maintenance.tms_backend_application.user.service;

import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.powergrid.maintenance.tms_backend_application.user.repository.UserRepository;
import com.powergrid.maintenance.tms_backend_application.user.repository.OtpRepository;
import com.powergrid.maintenance.tms_backend_application.user.dto.UpdateUserProfileRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for user management operations like registration.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Autowired
    private OtpService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private OtpRepository otpRepository;

    /**
     * Register a new user with encrypted password (account disabled until email verification).
     *
     * @param user the user to register (with plain text password)
     * @return the saved user with encrypted password
     * @throws IllegalArgumentException if username or email already exists
     */
    @Transactional
    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + user.getUsername());
        }

        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + user.getEmail());
        }

        // Encode the password before saving
        String rawPassword = user.getPassword();
        String encodedPassword = passwordEncoder.encode(rawPassword);
        user.setPassword(encodedPassword);

        // Set default values
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("ROLE_USER");
        }
        user.setEnabled(false); // Disabled until email verification
        user.setEmailVerified(false);

        // Save user to database
        User savedUser = userRepository.save(user);
        log.info("User registered successfully (pending email verification): {}", savedUser.getUsername());

        // Generate and send OTP
        otpService.generateAndSendOtp(user.getEmail());

        return savedUser;
    }

    /**
     * Verify user email with OTP and enable account
     */
    @Transactional
    public boolean verifyEmail(String email, String otpCode) {
        // Verify OTP
        boolean otpValid = otpService.verifyOtp(email, otpCode);
        
        if (!otpValid) {
            return false;
        }

        // Find and enable user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        user.setEmailVerified(true);
        user.setEnabled(true);
        userRepository.save(user);

        // Send welcome email
        emailService.sendWelcomeEmail(email, user.getUsername());

        // Clean up OTP
        otpService.deleteOtp(email);

        log.info("Email verified successfully for user: {}", user.getUsername());
        return true;
    }

    /**
     * Get a user by username.
     *
     * @param username the username to search for
     * @return the user if found, null otherwise
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    /**
     * Check if a username exists.
     *
     * @param username the username to check
     * @return true if exists, false otherwise
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    /**
     * Update user profile information
     */
    @Transactional
    public User updateUserProfile(String username, UpdateUserProfileRequest updateRequest) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Update fields if provided
        if (updateRequest.getEmployeeId() != null) {
            user.setEmployeeId(updateRequest.getEmployeeId());
        }
        if (updateRequest.getFullName() != null) {
            user.setFullName(updateRequest.getFullName());
        }
        if (updateRequest.getDepartment() != null) {
            user.setDepartment(updateRequest.getDepartment());
        }
        if (updateRequest.getPhoneNumber() != null) {
            user.setPhoneNumber(updateRequest.getPhoneNumber());
        }
        if (updateRequest.getProfilePhotoUrl() != null) {
            user.setProfilePhotoUrl(updateRequest.getProfilePhotoUrl());
        }

        User updatedUser = userRepository.save(user);
        log.info("Profile updated for user: {}", username);
        return updatedUser;
    }

    /**
     * Delete user account after password verification
     */
    @Transactional
    public boolean deleteAccount(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        // Verify password
        if (!passwordEncoder.matches(password, user.getPassword())) {
            log.warn("Invalid password provided for account deletion: {}", username);
            return false;
        }

        // Delete OTP records if any
        if (user.getEmail() != null) {
            otpRepository.deleteByEmail(user.getEmail());
        }

        // Delete user
        userRepository.delete(user);
        log.info("Account deleted: {}", username);
        return true;
    }
}
