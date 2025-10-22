package com.powergrid.maintenance.tms_backend_application.admin.controller;

import com.powergrid.maintenance.tms_backend_application.admin.dto.RetrainingRequest;
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
     * Trigger model retraining
     */
    @PostMapping("/trigger")
    public ResponseEntity<?> triggerRetraining(@RequestBody RetrainingRequest request) {
        log.info("Retraining request received: {}", request);
        
        try {
            // Validate minimum corrections
            int correctionCount = retrainingService.getCorrectionCount();
            if (correctionCount < request.getMinCorrections()) {
                return ResponseEntity.badRequest()
                        .body(Map.of(
                                "error", "Not enough corrections",
                                "message", String.format("Need at least %d corrections, have %d",
                                        request.getMinCorrections(), correctionCount)
                        ));
            }

            // Trigger retraining
            String jobId = retrainingService.triggerRetraining(request);

            return ResponseEntity.ok(Map.of(
                    "jobId", jobId,
                    "status", "started",
                    "message", "Retraining initiated successfully",
                    "corrections", correctionCount
            ));

        } catch (Exception e) {
            log.error("Error triggering retraining", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Failed to trigger retraining: " + e.getMessage()));
        }
    }

    /**
     * Get status of a retraining job
     */
    @GetMapping("/status/{jobId}")
    public ResponseEntity<?> getTrainingStatus(@PathVariable String jobId) {
        log.info("Fetching status for job: {}", jobId);
        try {
            Map<String, Object> status = retrainingService.getJobStatus(jobId);
            if (status == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Error fetching job status", e);
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
