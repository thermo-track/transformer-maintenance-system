package com.powergrid.maintenance.tms_backend_application.inspection.controller;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnnotationAction;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnnotationRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnnotationResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnnotationViewDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.model.ActionType;
import com.powergrid.maintenance.tms_backend_application.inspection.service.AnnotationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for annotation feedback operations
 */
@RestController
@RequestMapping("/api/annotations")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
@Slf4j
public class AnnotationController {

    private final AnnotationService annotationService;

    /**
     * Get all annotations for an inspection
     * GET /api/annotations?inspectionId=123
     */
    @GetMapping
    public ResponseEntity<AnnotationViewDTO> getAnnotations(
            @RequestParam Long inspectionId) {
        log.debug("GET /api/annotations?inspectionId={}", inspectionId);
        AnnotationViewDTO result = annotationService.getAnnotationsForInspection(inspectionId);
        return ResponseEntity.ok(result);
    }

    /**
     * Create, edit, or delete annotation based on action type
     * POST /api/annotations
     */
    @PostMapping
    public ResponseEntity<AnnotationResponseDTO> handleAnnotation(
            @RequestBody AnnotationRequestDTO request) {
        
        log.info("POST /api/annotations - action: {}, inspectionId: {}, anomalyId: {}",
                request.getAction(), request.getInspectionId(), request.getAnomalyId());

        try {
            String username = getCurrentUsername();
            ActionType action = request.getAction();

            if (action == ActionType.CREATED) {
                // Create new user annotation
                InspectionAnomaly anomaly = annotationService.createUserAnnotation(request, username);
                return ResponseEntity.ok(AnnotationResponseDTO.success(
                        anomaly.getId(), null, "Annotation created successfully"));

            } else if (action == ActionType.EDITED) {
                // Edit existing annotation
                if (request.getAnomalyId() == null) {
                    return ResponseEntity.badRequest()
                            .body(AnnotationResponseDTO.error("anomalyId is required for EDIT action"));
                }
                InspectionAnomaly newAnomaly = annotationService.editAnnotation(
                        request.getAnomalyId(), request, username);
                return ResponseEntity.ok(AnnotationResponseDTO.successWithSuperseded(
                        newAnomaly.getId(), null, request.getAnomalyId(),
                        "Annotation edited successfully"));

            } else if (action == ActionType.DELETED) {
                // Delete annotation
                if (request.getAnomalyId() == null) {
                    return ResponseEntity.badRequest()
                            .body(AnnotationResponseDTO.error("anomalyId is required for DELETE action"));
                }
                annotationService.deleteAnnotation(
                        request.getAnomalyId(), request.getComment(), request.getUserId(), username);
                return ResponseEntity.ok(AnnotationResponseDTO.success(
                        request.getAnomalyId(), null, "Annotation deleted successfully"));

            } else if (action == ActionType.COMMENTED) {
                // Add comment
                if (request.getAnomalyId() == null) {
                    return ResponseEntity.badRequest()
                            .body(AnnotationResponseDTO.error("anomalyId is required for COMMENT action"));
                }
                annotationService.addComment(
                        request.getAnomalyId(), request.getComment(), request.getUserId(), username);
                return ResponseEntity.ok(AnnotationResponseDTO.success(
                        request.getAnomalyId(), null, "Comment added successfully"));

            } else if (action == ActionType.APPROVED) {
                // Accept AI detection
                if (request.getAnomalyId() == null) {
                    return ResponseEntity.badRequest()
                            .body(AnnotationResponseDTO.error("anomalyId is required for APPROVE action"));
                }
                annotationService.acceptAiDetection(
                        request.getAnomalyId(), request.getUserId(), username);
                return ResponseEntity.ok(AnnotationResponseDTO.success(
                        request.getAnomalyId(), null, "AI detection accepted"));

            } else if (action == ActionType.REJECTED) {
                // Reject AI detection
                if (request.getAnomalyId() == null) {
                    return ResponseEntity.badRequest()
                            .body(AnnotationResponseDTO.error("anomalyId is required for REJECT action"));
                }
                annotationService.rejectAiDetection(
                        request.getAnomalyId(), request.getComment(), request.getUserId(), username);
                return ResponseEntity.ok(AnnotationResponseDTO.success(
                        request.getAnomalyId(), null, "AI detection rejected"));

            } else {
                return ResponseEntity.badRequest()
                        .body(AnnotationResponseDTO.error("Unsupported action type: " + action));
            }

        } catch (Exception e) {
            log.error("Error handling annotation action", e);
            return ResponseEntity.internalServerError()
                    .body(AnnotationResponseDTO.error("Error: " + e.getMessage()));
        }
    }

    /**
     * Get annotation history for a specific anomaly
     * GET /api/annotations/{anomalyId}/history
     */
    @GetMapping("/{anomalyId}/history")
    public ResponseEntity<List<AnnotationAction>> getAnnotationHistory(
            @PathVariable Long anomalyId) {
        log.debug("GET /api/annotations/{}/history", anomalyId);
        List<AnnotationAction> history = annotationService.getAnnotationHistory(anomalyId);
        return ResponseEntity.ok(history);
    }

    /**
     * Get all actions for an inspection
     * GET /api/annotations/inspection/{inspectionId}/actions
     */
    @GetMapping("/inspection/{inspectionId}/actions")
    public ResponseEntity<List<AnnotationAction>> getInspectionActions(
            @PathVariable Long inspectionId) {
        log.debug("GET /api/annotations/inspection/{}/actions", inspectionId);
        List<AnnotationAction> actions = annotationService.getInspectionActions(inspectionId);
        return ResponseEntity.ok(actions);
    }

    /**
     * Get all annotation actions across all inspections
     * This is accessible to all authenticated users (not admin-only)
     * GET /api/annotations/history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getAllAnnotationActions() {
        log.info("Fetching all annotation actions for annotation history view");
        try {
            // Use the service method to get all actions with inspection metadata
            var result = annotationService.getAllAnnotationActionsWithMetadata();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching annotation history", e);
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("success", false, "error", "Failed to fetch annotation history: " + e.getMessage()));
        }
    }

    /**
     * Helper method to get current authenticated username
     */
    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            return authentication.getName();
        }
        return "anonymous";
    }
}
