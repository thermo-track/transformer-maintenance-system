package com.powergrid.maintenance.tms_backend_application.user.controller;

import com.powergrid.maintenance.tms_backend_application.user.dto.RoleChangeRequestDTO;
import com.powergrid.maintenance.tms_backend_application.user.dto.RoleChangeRequestRequest;
import com.powergrid.maintenance.tms_backend_application.user.dto.ReviewRoleChangeRequest;
import com.powergrid.maintenance.tms_backend_application.user.service.RoleChangeRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/role-change-requests")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Role Change Requests", description = "Endpoints for managing user role change requests")
public class RoleChangeRequestController {

    private final RoleChangeRequestService roleChangeRequestService;

    @Operation(summary = "Create a role change request", description = "Allows a user to request a role change (e.g., to MAINTENANCE_ENGINEER)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Request created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or pending request already exists"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping
    public ResponseEntity<RoleChangeRequestDTO> createRoleChangeRequest(
            @RequestBody RoleChangeRequestRequest request,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            RoleChangeRequestDTO created = roleChangeRequestService.createRoleChangeRequest(username, request);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            log.error("Error creating role change request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @Operation(summary = "Get all role change requests", description = "Admin endpoint to get all role change requests")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Requests retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RoleChangeRequestDTO>> getAllRoleChangeRequests() {
        List<RoleChangeRequestDTO> requests = roleChangeRequestService.getAllRoleChangeRequests();
        return ResponseEntity.ok(requests);
    }

    @Operation(summary = "Get pending role change requests", description = "Admin endpoint to get pending role change requests")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Requests retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<RoleChangeRequestDTO>> getPendingRoleChangeRequests() {
        List<RoleChangeRequestDTO> requests = roleChangeRequestService.getPendingRoleChangeRequests();
        return ResponseEntity.ok(requests);
    }

    @Operation(summary = "Get my role change requests", description = "Get the authenticated user's role change requests")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Requests retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/my-requests")
    public ResponseEntity<List<RoleChangeRequestDTO>> getMyRoleChangeRequests(Authentication authentication) {
        String username = authentication.getName();
        List<RoleChangeRequestDTO> requests = roleChangeRequestService.getUserRoleChangeRequests(username);
        return ResponseEntity.ok(requests);
    }

    @Operation(summary = "Review a role change request", description = "Admin endpoint to approve or reject a role change request")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Request reviewed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or already reviewed"),
            @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required"),
            @ApiResponse(responseCode = "404", description = "Request not found")
    })
    @PutMapping("/{requestId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reviewRoleChangeRequest(
            @PathVariable Long requestId,
            @RequestBody ReviewRoleChangeRequest review,
            Authentication authentication) {
        try {
            log.info("Received review request - ID: {}, Status: {}, Comment: {}", requestId, review.getStatus(), review.getReviewComment());
            String reviewerUsername = authentication.getName();
            RoleChangeRequestDTO reviewed = roleChangeRequestService.reviewRoleChangeRequest(requestId, reviewerUsername, review);
            return ResponseEntity.ok(reviewed);
        } catch (RuntimeException e) {
            log.error("Error reviewing role change request {}: {}", requestId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }
    
    // Simple error response class
    private static class ErrorResponse {
        private final String error;
        
        public ErrorResponse(String error) {
            this.error = error;
        }
        
        @SuppressWarnings("unused") // Used by Jackson for JSON serialization
        public String getError() {
            return error;
        }
    }

    @Operation(summary = "Cancel a role change request", description = "Cancel your own pending role change request")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Request cancelled successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or not pending"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "404", description = "Request not found")
    })
    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> cancelRoleChangeRequest(
            @PathVariable Long requestId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            roleChangeRequestService.cancelRoleChangeRequest(requestId, username);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error cancelling role change request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
