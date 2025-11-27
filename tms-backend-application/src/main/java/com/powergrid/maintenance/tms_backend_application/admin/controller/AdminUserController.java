package com.powergrid.maintenance.tms_backend_application.admin.controller;

import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.powergrid.maintenance.tms_backend_application.user.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST Controller for admin user management operations.
 * Requires ADMIN role for all endpoints.
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private static final Logger log = LoggerFactory.getLogger(AdminUserController.class);

    @Autowired
    private UserService userService;

    /**
     * Get all users
     * GET /api/admin/users
     * 
     * @return ResponseEntity with list of users
     */
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            List<User> users = userService.getAllUsers();
            
            // Create simplified response (don't send passwords!)
            List<Map<String, Object>> userList = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("username", user.getUsername());
                    userMap.put("email", user.getEmail());
                    userMap.put("role", user.getRole());
                    userMap.put("enabled", user.isEnabled());
                    userMap.put("emailVerified", user.isEmailVerified());
                    userMap.put("fullName", user.getFullName());
                    userMap.put("department", user.getDepartment());
                    userMap.put("employeeId", user.getEmployeeId());
                    return userMap;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(userList);

        } catch (Exception e) {
            log.error("Error fetching all users: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch users: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Update user role (direct admin action, bypasses approval process)
     * PUT /api/admin/users/{userId}/role
     * 
     * @param userId the ID of the user to update
     * @param requestBody JSON with "role" field
     * @return ResponseEntity with updated user info
     */
    @PutMapping("/{userId}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> requestBody) {
        try {
            String newRole = requestBody.get("role");
            
            if (newRole == null || newRole.trim().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Role is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }

            User updatedUser = userService.updateUserRole(userId, newRole);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User role updated successfully");
            response.put("userId", updatedUser.getId());
            response.put("username", updatedUser.getUsername());
            response.put("newRole", updatedUser.getRole());

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request to update user role: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            log.error("Error updating user role: ", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to update user role: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
