package com.powergrid.maintenance.tms_backend_application.admin.controller;

import com.powergrid.maintenance.tms_backend_application.admin.service.ModelRetrainingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Admin controller for model retraining operations.
 * Only accessible by users with ROLE_ADMIN.
 */
@RestController
@RequestMapping("/api/admin/retraining")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')") // Only admins can access these endpoints
public class AdminRetrainingController {

    private final ModelRetrainingService retrainingService;

    /**
     * Get all annotation actions for model retraining review
     */
    @GetMapping("/annotations")
    public ResponseEntity<?> getAnnotations() {
        log.info("Fetching all annotation actions for retraining");
        try {
            Map<String, Object> result = retrainingService.getAllAnnotationActions();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error fetching annotations", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "error", "Failed to fetch annotations: " + e.getMessage()));
        }
    }

    /**
     * Get retraining statistics (corrections count, last training date, etc.)
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getRetrainingStats() {
        log.info("Fetching retraining statistics");
        try {
            Map<String, Object> stats = retrainingService.getRetrainingStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error fetching retraining stats", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch statistics: " + e.getMessage()));
        }
    }

    /**
     * Trigger incremental model retraining with user corrections
     */
    @PostMapping("/trigger")
    public ResponseEntity<?> triggerRetraining(
            @RequestHeader("X-Username") String username) {
        log.info("Retraining triggered by user: {}", username);
        
        try {
            // Get stats to check if ready for retraining
            Map<String, Object> stats = retrainingService.getRetrainingStats();
            long newCorrections = (Long) stats.get("totalCorrections");
            
            if (newCorrections < 1) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "success", false,
                                "error", "No new corrections available",
                                "message", "There are no new annotation actions to train on"
                        ));
            }

            // Trigger retraining
            String runId = retrainingService.triggerRetraining(username);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "runId", runId,
                    "status", "started",
                    "message", "Incremental retraining initiated successfully",
                    "corrections", newCorrections
            ));

        } catch (Exception e) {
            log.error("Error triggering retraining", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "error", "Failed to trigger retraining: " + e.getMessage()
                    ));
        }
    }

    /**
     * Get status of a retraining run
     */
    @GetMapping("/status/{runId}")
    public ResponseEntity<?> getRetrainingStatus(@PathVariable String runId) {
        log.info("Fetching status for run: {}", runId);
        try {
            return retrainingService.getRetrainingStatus(runId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error fetching run status", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch status: " + e.getMessage()));
        }
    }

    /**
     * Get list of recent retraining jobs
     */
    @GetMapping("/history")
    public ResponseEntity<?> getRetrainingHistory(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Fetching retraining history (limit: {})", limit);
        try {
            return ResponseEntity.ok(retrainingService.getRetrainingHistory(limit));
        } catch (Exception e) {
            log.error("Error fetching history", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to fetch history: " + e.getMessage()));
        }
    }
}
