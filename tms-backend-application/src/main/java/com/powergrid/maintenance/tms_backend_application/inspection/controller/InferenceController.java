package com.powergrid.maintenance.tms_backend_application.inspection.controller;

import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageMetadataDTO;
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
}