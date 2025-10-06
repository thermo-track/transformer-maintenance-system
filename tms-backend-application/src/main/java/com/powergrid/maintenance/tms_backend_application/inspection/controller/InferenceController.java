package com.powergrid.maintenance.tms_backend_application.inspection.controller;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageMetadataDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ThresholdConfigDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.service.ThermalInferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class InferenceController {

    private final ThermalInferenceService thermalInferenceService;

    /**
     * Existing endpoint: upload + run inference.
     * (Now writes inference results via UPSERT; no unique constraint issues.)
     */
    @PostMapping("/{inspectionId}/upload-thermal-with-inference")
    public ResponseEntity<Map<String, Object>> uploadThermalWithInference(
            @PathVariable String inspectionId,
            @RequestBody ImageMetadataDTO imageMetadata) {

        log.info("Uploading thermal image and running inference for inspection: {}", inspectionId);

        try {
            Map<String, Object> result = thermalInferenceService.processAndInfer(
                    inspectionId,
                    imageMetadata
            );
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            log.error("Failed to process thermal image for inspection {}: {}", inspectionId, e.getMessage());
            throw new RuntimeException("Thermal image processing failed: " + e.getMessage());
        }
    }

    /**
     * NEW: Only update the maintenance image URL in inference_metadata (no inference).
     * Pass the URL in ImageMetadataDTO.cloudImageUrl.
     */
    @PutMapping("/{inspectionId}/maintenance-url")
    public ResponseEntity<?> updateMaintenanceUrlOnly(
            @PathVariable String inspectionId,
            @RequestBody ImageMetadataDTO dto) {

        try {
            if (dto.getCloudImageUrl() == null || dto.getCloudImageUrl().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "BAD_REQUEST",
                        "message", "cloudImageUrl is required"
                ));
            }

            thermalInferenceService.updateMaintenanceImageUrlOnly(inspectionId, dto.getCloudImageUrl());
            return ResponseEntity.ok(Map.of(
                    "inspectionId", inspectionId,
                    "maintenanceImageUrl", dto.getCloudImageUrl(),
                    "status", "URL_UPDATED"
            ));

        } catch (Exception e) {
            log.error("Failed to update maintenance URL for inspection {}: {}", inspectionId, e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "INTERNAL_ERROR",
                    "message", e.getMessage()
            ));
        }
    }


    @PutMapping("/{inspectionId}/anomalies/{anomalyId}/notes")
    public ResponseEntity<InspectionAnomaly> updateAnomalyNotes(
            @PathVariable String inspectionId,
            @PathVariable Long anomalyId,
            @RequestBody Map<String, String> payload) {
        try {
            log.info("Updating notes for anomaly {} in inspection {}", anomalyId, inspectionId);
            String notes = payload.get("notes");
            if (notes == null) {
                return ResponseEntity.badRequest().build();
            }

            InspectionAnomaly updated = thermalInferenceService.updateAnomalyNotes(inspectionId, anomalyId, notes);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Failed to update notes: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error updating notes: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{inspectionId}/rerun-inference")
    public ResponseEntity<Map<String, Object>> rerunInferenceWithThresholds(
            @PathVariable String inspectionId,
            @RequestBody ThresholdConfigDTO thresholds) {
        try {
            log.info("Re-running inference for inspection {} with custom thresholds", inspectionId);

            Map<String, Object> result = thermalInferenceService.rerunInference(
                    inspectionId,
                    thresholds
            );

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to re-run inference: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
