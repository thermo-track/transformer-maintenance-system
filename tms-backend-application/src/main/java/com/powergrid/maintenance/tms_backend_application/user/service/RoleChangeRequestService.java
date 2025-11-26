package com.powergrid.maintenance.tms_backend_application.user.service;

import com.powergrid.maintenance.tms_backend_application.user.dto.RoleChangeRequestDTO;
import com.powergrid.maintenance.tms_backend_application.user.dto.RoleChangeRequestRequest;
import com.powergrid.maintenance.tms_backend_application.user.dto.ReviewRoleChangeRequest;
import com.powergrid.maintenance.tms_backend_application.user.model.RoleChangeRequest;
import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.powergrid.maintenance.tms_backend_application.user.repository.RoleChangeRequestRepository;
import com.powergrid.maintenance.tms_backend_application.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RoleChangeRequestService {

    private final RoleChangeRequestRepository roleChangeRequestRepository;
    private final UserRepository userRepository;

    /**
     * Create a new role change request
     */
    @Transactional
    public RoleChangeRequestDTO createRoleChangeRequest(String username, RoleChangeRequestRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user already has a pending request
        Optional<RoleChangeRequest> existingRequest = roleChangeRequestRepository.findByUserAndStatus(user, "PENDING");
        if (existingRequest.isPresent()) {
            throw new RuntimeException("You already have a pending role change request");
        }

        RoleChangeRequest roleChangeRequest = new RoleChangeRequest();
        roleChangeRequest.setUser(user);
        roleChangeRequest.setRequestedRole(request.getRequestedRole());
        roleChangeRequest.setReason(request.getReason());
        roleChangeRequest.setStatus("PENDING");

        RoleChangeRequest saved = roleChangeRequestRepository.save(roleChangeRequest);
        log.info("Role change request created for user: {} requesting role: {}", username, request.getRequestedRole());

        return mapToDTO(saved);
    }

    /**
     * Get all role change requests (admin only)
     */
    public List<RoleChangeRequestDTO> getAllRoleChangeRequests() {
        return roleChangeRequestRepository.findAllByOrderByRequestedAtDesc().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get pending role change requests (admin only)
     */
    public List<RoleChangeRequestDTO> getPendingRoleChangeRequests() {
        return roleChangeRequestRepository.findByStatus("PENDING").stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get user's own role change requests
     */
    public List<RoleChangeRequestDTO> getUserRoleChangeRequests(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return roleChangeRequestRepository.findByUserOrderByRequestedAtDesc(user).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Review a role change request (approve or reject)
     */
    @Transactional
    public RoleChangeRequestDTO reviewRoleChangeRequest(Long requestId, String reviewerUsername, ReviewRoleChangeRequest review) {
        RoleChangeRequest request = roleChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Role change request not found"));

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("This request has already been reviewed");
        }

        User reviewer = userRepository.findByUsername(reviewerUsername)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        request.setStatus(review.getStatus());
        request.setReviewedAt(Instant.now());
        request.setReviewedBy(reviewer);
        request.setReviewComment(review.getReviewComment());

        // If approved, update user's role
        if ("APPROVED".equals(review.getStatus())) {
            User user = request.getUser();
            String oldRole = user.getRole();
            user.setRole(request.getRequestedRole());
            userRepository.save(user);
            log.info("User {} role changed from {} to {} by {}", user.getUsername(), oldRole, request.getRequestedRole(), reviewerUsername);
        }

        RoleChangeRequest saved = roleChangeRequestRepository.save(request);
        log.info("Role change request {} reviewed by {} with status: {}", requestId, reviewerUsername, review.getStatus());

        return mapToDTO(saved);
    }

    /**
     * Cancel a pending role change request (by the user who created it)
     */
    @Transactional
    public void cancelRoleChangeRequest(Long requestId, String username) {
        RoleChangeRequest request = roleChangeRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Role change request not found"));

        if (!request.getUser().getUsername().equals(username)) {
            throw new RuntimeException("You can only cancel your own requests");
        }

        if (!"PENDING".equals(request.getStatus())) {
            throw new RuntimeException("Only pending requests can be cancelled");
        }

        roleChangeRequestRepository.delete(request);
        log.info("Role change request {} cancelled by user {}", requestId, username);
    }

    /**
     * Map RoleChangeRequest entity to DTO
     */
    private RoleChangeRequestDTO mapToDTO(RoleChangeRequest request) {
        RoleChangeRequestDTO dto = new RoleChangeRequestDTO();
        dto.setId(request.getId());
        dto.setUserId(request.getUser().getId());
        dto.setUsername(request.getUser().getUsername());
        dto.setEmail(request.getUser().getEmail());
        dto.setFullName(request.getUser().getFullName());
        dto.setDepartment(request.getUser().getDepartment());
        dto.setCurrentRole(request.getUser().getRole());
        dto.setRequestedRole(request.getRequestedRole());
        dto.setReason(request.getReason());
        dto.setStatus(request.getStatus());
        dto.setRequestedAt(request.getRequestedAt());
        dto.setReviewedAt(request.getReviewedAt());
        if (request.getReviewedBy() != null) {
            dto.setReviewedByUsername(request.getReviewedBy().getUsername());
        }
        dto.setReviewComment(request.getReviewComment());
        return dto;
    }
}
