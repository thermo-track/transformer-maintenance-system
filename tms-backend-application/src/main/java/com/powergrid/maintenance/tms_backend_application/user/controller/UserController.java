package com.powergrid.maintenance.tms_backend_application.user.controller;

import com.powergrid.maintenance.tms_backend_application.user.dto.LoginRequest;
import com.powergrid.maintenance.tms_backend_application.user.dto.LoginResponse;
import com.powergrid.maintenance.tms_backend_application.user.dto.RegisterRequest;
import com.powergrid.maintenance.tms_backend_application.user.dto.VerifyOtpRequest;
import com.powergrid.maintenance.tms_backend_application.user.dto.UpdateUserProfileRequest;
import com.powergrid.maintenance.tms_backend_application.user.dto.UserProfileResponse;
import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.powergrid.maintenance.tms_backend_application.user.service.OtpService;
import com.powergrid.maintenance.tms_backend_application.user.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for user authentication and registration.
 */
@RestController
@RequestMapping("/api/auth")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;

    @Autowired
    private OtpService otpService;

    @Autowired
    private AuthenticationManager authenticationManager;

    /**
     * Register a new user.
     * POST /api/auth/register
     *
     * @param registerRequest the registration details
     * @return ResponseEntity with success/error message
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        try {
            // Create user entity from request
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(registerRequest.getPassword());
            
            if (registerRequest.getRole() != null && !registerRequest.getRole().isEmpty()) {
                user.setRole(registerRequest.getRole());
            }

            // Register user (password will be encrypted in service, OTP will be sent)
            User savedUser = userService.registerUser(user);

            log.info("User registered successfully (pending email verification): {}", savedUser.getUsername());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Registration successful. Please check your email for verification code.");
            response.put("email", savedUser.getEmail());
            response.put("username", savedUser.getUsername());
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (IllegalArgumentException e) {
            log.error("Registration failed: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Registration error: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Registration failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Verify email with OTP code.
     * POST /api/auth/verify-otp
     *
     * @param verifyRequest the verification details (email and OTP code)
     * @return ResponseEntity with verification result
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody VerifyOtpRequest verifyRequest) {
        try {
            boolean verified = userService.verifyEmail(verifyRequest.getEmail(), verifyRequest.getOtpCode());
            
            if (verified) {
                log.info("Email verified successfully: {}", verifyRequest.getEmail());
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Email verified successfully. You can now login.");
                return ResponseEntity.ok(response);
            } else {
                log.warn("Invalid or expired OTP for email: {}", verifyRequest.getEmail());
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid or expired verification code.");
                return ResponseEntity.badRequest().body(errorResponse);
            }
        } catch (Exception e) {
            log.error("OTP verification error: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Verification failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Resend OTP to email.
     * POST /api/auth/resend-otp
     *
     * @param email the email to resend OTP to
     * @return ResponseEntity with result
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@RequestParam String email) {
        try {
            otpService.resendOtp(email);
            log.info("OTP resent to: {}", email);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Verification code has been resent to your email.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error resending OTP: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to resend verification code.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Authenticate user and create session.
     * POST /api/auth/login
     *
     * @param loginRequest the login credentials
     * @return ResponseEntity with authentication result
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest loginRequest) {
        try {
            // Create authentication token
            UsernamePasswordAuthenticationToken authToken = 
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(), 
                            loginRequest.getPassword()
                    );

            // Authenticate user
            Authentication authentication = authenticationManager.authenticate(authToken);

            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // Get user details
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String role = userDetails.getAuthorities().iterator().next().getAuthority();

            log.info("User logged in successfully: {}", userDetails.getUsername());

            return ResponseEntity.ok(
                    new LoginResponse(true, "Login successful", userDetails.getUsername(), role)
            );

        } catch (BadCredentialsException e) {
            log.error("Login failed - bad credentials for user: {}", loginRequest.getUsername());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    new LoginResponse(false, "Invalid username or password")
            );
        } catch (Exception e) {
            log.error("Login error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new LoginResponse(false, "Login failed: " + e.getMessage())
            );
        }
    }

    /**
     * Logout user.
     * POST /api/auth/logout
     *
     * @return ResponseEntity with logout result
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        try {
            // Clear security context
            SecurityContextHolder.clearContext();
            
            log.info("User logged out successfully");
            
            return ResponseEntity.ok(
                    new LoginResponse(true, "Logout successful")
            );
        } catch (Exception e) {
            log.error("Logout error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new LoginResponse(false, "Logout failed: " + e.getMessage())
            );
        }
    }

    /**
     * Get current authenticated user info.
     * GET /api/auth/me
     *
     * @return ResponseEntity with current user details
     */
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || !authentication.isAuthenticated() 
                    || authentication.getPrincipal().equals("anonymousUser")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                        new LoginResponse(false, "Not authenticated")
                );
            }

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String role = userDetails.getAuthorities().iterator().next().getAuthority();

            return ResponseEntity.ok(
                    new LoginResponse(true, "Authenticated", userDetails.getUsername(), role)
            );

        } catch (Exception e) {
            log.error("Error getting current user: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                    new LoginResponse(false, "Error getting user info")
            );
        }
    }

    /**
     * Get user profile.
     * GET /api/auth/profile
     * Requires authentication.
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getUserProfile() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            User user = userService.getUserByUsername(username);
            
            UserProfileResponse response = 
                new UserProfileResponse(
                    user.getId(),
                    user.getUsername(),
                    user.getEmail(),
                    user.getRole(),
                    user.isEnabled(),
                    user.isEmailVerified(),
                    user.getEmployeeId(),
                    user.getFullName(),
                    user.getDepartment(),
                    user.getPhoneNumber(),
                    user.getProfilePhotoUrl(),
                    user.getCreatedAt()
                );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting user profile: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "message", "Failed to get user profile")
            );
        }
    }

    /**
     * Update user profile.
     * PUT /api/auth/profile
     * Requires authentication.
     */
    @PutMapping("/profile")
    public ResponseEntity<?> updateUserProfile(
            @Valid @RequestBody UpdateUserProfileRequest updateRequest) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            
            User updatedUser = userService.updateUserProfile(username, updateRequest);
            
            log.info("User profile updated: {}", username);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Profile updated successfully",
                "user", new UserProfileResponse(
                    updatedUser.getId(),
                    updatedUser.getUsername(),
                    updatedUser.getEmail(),
                    updatedUser.getRole(),
                    updatedUser.isEnabled(),
                    updatedUser.isEmailVerified(),
                    updatedUser.getEmployeeId(),
                    updatedUser.getFullName(),
                    updatedUser.getDepartment(),
                    updatedUser.getPhoneNumber(),
                    updatedUser.getProfilePhotoUrl(),
                    updatedUser.getCreatedAt()
                )
            ));
        } catch (Exception e) {
            log.error("Error updating user profile: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "message", "Failed to update profile: " + e.getMessage())
            );
        }
    }

    /**
     * Delete user account.
     * DELETE /api/auth/account
     * Requires authentication and password confirmation.
     */
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount(@RequestBody Map<String, String> request) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            String password = request.get("password");
            
            if (password == null || password.isEmpty()) {
                return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Password is required to delete account")
                );
            }
            
            boolean deleted = userService.deleteAccount(username, password);
            
            if (deleted) {
                // Clear security context
                SecurityContextHolder.clearContext();
                
                log.info("Account deleted: {}", username);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Account deleted successfully"
                ));
            } else {
                return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Invalid password")
                );
            }
        } catch (Exception e) {
            log.error("Error deleting account: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                Map.of("success", false, "message", "Failed to delete account: " + e.getMessage())
            );
        }
    }
}
