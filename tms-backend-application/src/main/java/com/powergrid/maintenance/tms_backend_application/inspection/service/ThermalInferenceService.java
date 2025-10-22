package com.powergrid.maintenance.tms_backend_application.inspection.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InferenceMetadata;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageMetadataDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ThresholdConfigDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InferenceMetadataRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionAnomalyRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerImageRepository;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.TransformerImage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ThermalInferenceService {

    private final InspectionRepo inspectionRepository;
    private final InferenceMetadataRepository inferenceMetadataRepository;
    private final InspectionAnomalyRepository anomalyRepository;
    private final TransformerRepository transformerRepository;
    private final TransformerImageRepository transformerImageRepository;
    private final RestTemplate restTemplate;

    @Value("${inference.api.url:http://localhost:8001}")
    private String pythonApiUrl;

    /** Update ONLY the maintenance image URL for this inspection (create row if missing). */
    public void updateMaintenanceImageUrlOnly(String inspectionId, String maintenanceUrl) {
        int updated = inferenceMetadataRepository.updateMaintenanceUrlOnly(Long.parseLong(inspectionId), maintenanceUrl);
        if (updated > 0) {
            log.info("Updated maintenance image URL for inspection {} -> {}", inspectionId, maintenanceUrl);
            return;
        }
        // Row not found -> create the single record for this inspection
        InferenceMetadata meta = new InferenceMetadata();
        meta.setInspectionId(Long.parseLong(inspectionId));
        meta.setMaintenanceImageUrl(maintenanceUrl);
        meta.setCreatedAt(LocalDateTime.now());   // keep your existing createdAt usage
        inferenceMetadataRepository.save(meta);
        log.info("Created inference metadata row for inspection {} with maintenance URL {}", inspectionId, maintenanceUrl);
    }

    /**
     * Update notes for a specific anomaly
     * @param inspectionIdStr String representation of inspection ID
     * @param anomalyId The anomaly ID
     * @param notes The notes to save
     * @return Updated anomaly
     */
    public InspectionAnomaly updateAnomalyNotes(String inspectionIdStr, Long anomalyId, String notes) {
        try {
            // Convert string ID to Long for database operations
            Long inspectionId = Long.parseLong(inspectionIdStr);
            
            InspectionAnomaly anomaly = anomalyRepository.findById(anomalyId)
                    .orElseThrow(() -> new RuntimeException("Anomaly not found: " + anomalyId));

            // Verify the anomaly belongs to this inspection
            if (!anomaly.getInspectionId().equals(inspectionId)) {
                throw new RuntimeException("Anomaly does not belong to inspection");
            }

            // Update notes - you'll need to add a notes field to InspectionAnomaly entity
            // anomaly.setNotes(notes);
            
            return anomalyRepository.save(anomaly);
        } catch (NumberFormatException e) {
            log.error("Invalid inspection ID format: {}", inspectionIdStr);
            throw new RuntimeException("Invalid inspection ID format: " + inspectionIdStr, e);
        } catch (Exception e) {
            log.error("Error updating anomaly notes: {}", e.getMessage());
            throw new RuntimeException("Failed to update anomaly notes", e);
        }
    }

    /**
     * Process inspection image and run inference
     * @param inspectionIdStr String representation of inspection ID
     * @param imageMetadata Image metadata including thresholds
     * @return Combined response with metadata and inference results
     */
    public Map<String, Object> processAndInfer(String inspectionIdStr, ImageMetadataDTO imageMetadata) {
        try {
            // Convert string ID to Long for database operations
            Long inspectionId = Long.parseLong(inspectionIdStr);

            // 1. Load inspection and update only non-null fields (avoid clobbering on reruns)
            Inspection inspection = inspectionRepository.findById(inspectionId)
                    .orElseThrow(() -> new RuntimeException("Inspection not found: " + inspectionIdStr));

            if (imageMetadata.getCloudImageUrl() != null)
                inspection.setCloudImageUrl(imageMetadata.getCloudImageUrl());
            if (imageMetadata.getCloudinaryPublicId() != null)
                inspection.setCloudinaryPublicId(imageMetadata.getCloudinaryPublicId());
            if (imageMetadata.getCloudImageName() != null)
                inspection.setCloudImageName(imageMetadata.getCloudImageName());
            if (imageMetadata.getCloudImageType() != null)
                inspection.setCloudImageType(imageMetadata.getCloudImageType());
            if (imageMetadata.getEnvironmentalCondition() != null)
                inspection.setEnvironmentalCondition(imageMetadata.getEnvironmentalCondition());
            if (imageMetadata.getCloudUploadedAt() != null)
                inspection.setCloudUploadedAt(imageMetadata.getCloudUploadedAt());

            inspectionRepository.save(inspection);
            log.info("Updated inspection {} with cloud image metadata", inspectionIdStr);

            // CRITICAL: Delete old inference data before attempting new inference
            // This prevents stale detection data from being shown with the new image
            log.info("Deleting old inference data for inspection {}", inspectionIdStr);
            
            // Delete existing anomalies
            List<InspectionAnomaly> existingAnomalies = anomalyRepository.findByInspectionId(inspectionId);
            if (!existingAnomalies.isEmpty()) {
                log.info("Deleting {} existing anomalies", existingAnomalies.size());
                anomalyRepository.deleteAll(existingAnomalies);
                try {
                    int affected = anomalyRepository.deleteByInspectionId(inspectionId);
                    log.info("anomalyRepository.deleteByInspectionId affected rows: {}", affected);
                } catch (Exception e) {
                    log.warn("anomalyRepository.deleteByInspectionId threw: {}", e.getMessage());
                }
            }
            
            // Delete existing inference metadata
            inferenceMetadataRepository.findByInspectionId(inspectionId)
                    .ifPresent(metadata -> {
                        log.info("Deleting existing inference metadata");
                        inferenceMetadataRepository.delete(metadata);
                    });
            
            log.info("Old inference data cleared successfully");

            // Prepare response with metadata (always included)
            Map<String, Object> response = new HashMap<>();
            response.put("metadata", imageMetadata);
            response.put("imageUpdated", true);

            // 2. Try to run inference - but don't fail if it doesn't work
            try {
                // Determine env (prefer DTO, else persisted inspection) and fetch baseline URL
                String env = imageMetadata.getEnvironmentalCondition() != null
                        ? imageMetadata.getEnvironmentalCondition()
                        : inspection.getEnvironmentalCondition();

                String baselineUrl = getBaselineImageUrl(inspection.getTransformerNo(), env);

                if (baselineUrl == null) {
                    log.warn("No baseline image found for transformer {} with condition {}", 
                            inspection.getTransformerNo(), env);
                    response.put("inferenceStatus", "SKIPPED");
                    response.put("inferenceMessage", "No baseline image available");
                    return response;
                }

                // 3. Call Python inference API with thresholds (DTO values or defaults)
                Map<String, Object> inferenceResult = callPythonInference(
                        baselineUrl,
                        imageMetadata.getCloudImageUrl(),
                        inspectionIdStr,  // Send as string to Python API
                        imageMetadata.getThresholdPct(),
                        imageMetadata.getIouThresh(),
                        imageMetadata.getConfThresh()
                );

                // 4. Save inference results to database using Long ID
                saveInferenceResults(inspectionId, inferenceResult, baselineUrl, imageMetadata.getCloudImageUrl());

                // 5. Add inference results to response
                response.put("inference", inferenceResult);
                response.put("inferenceStatus", "SUCCESS");
                log.info("Inference completed successfully for inspection {}", inspectionIdStr);

            } catch (Exception inferenceError) {
                // Log the error but don't fail the entire request
                log.error("Inference failed for inspection {} but image was saved: {}", 
                        inspectionIdStr, inferenceError.getMessage());
                response.put("inferenceStatus", "FAILED");
                response.put("inferenceError", inferenceError.getMessage());
                response.put("inferenceMessage", "Image saved successfully, but inference failed. You can retry later.");
            }

            return response;
            
        } catch (NumberFormatException e) {
            log.error("Invalid inspection ID format: {}", inspectionIdStr);
            throw new RuntimeException("Invalid inspection ID format: " + inspectionIdStr, e);
        }
    }

    /**
     * Re-run inference with new threshold settings
     * @param inspectionIdStr String representation of inspection ID
     * @param thresholds New threshold configuration
     * @return Inference results
     */
    public Map<String, Object> rerunInference(String inspectionIdStr, ThresholdConfigDTO thresholds) {
        try {
            // Convert string ID to Long for database operations
            Long inspectionId = Long.parseLong(inspectionIdStr);
            
            // Get existing inspection image URL - use Long ID
            Inspection inspection = inspectionRepository.findById(inspectionId)
                    .orElseThrow(() -> new RuntimeException("Inspection not found"));

            if (inspection.getCloudImageUrl() == null) {
                throw new RuntimeException("No image found for this inspection");
            }

            // Delete existing anomalies using Long ID
            anomalyRepository.deleteByInspectionId(inspectionId);

            // Create metadata with new thresholds (preserve env so baseline lookup works)
            ImageMetadataDTO metadata = new ImageMetadataDTO();
            metadata.setCloudImageUrl(inspection.getCloudImageUrl());
            metadata.setEnvironmentalCondition(inspection.getEnvironmentalCondition());
            metadata.setThresholdPct(thresholds.getThresholdPct());
            metadata.setIouThresh(thresholds.getIouThresh());
            metadata.setConfThresh(thresholds.getConfThresh());

            // Re-run inference with string ID for API consistency
            return processAndInfer(inspectionIdStr, metadata);
            
        } catch (NumberFormatException e) {
            log.error("Invalid inspection ID format: {}", inspectionIdStr);
            throw new RuntimeException("Invalid inspection ID format: " + inspectionIdStr, e);
        }
    }

    /**
     * Get baseline image URL for a transformer and environmental condition
     */
    private String getBaselineImageUrl(String transformerNo, String environmentalCondition) {
        try {
            if (environmentalCondition == null || environmentalCondition.isBlank()) {
                throw new RuntimeException("Environmental condition is missing for baseline lookup");
            }

            log.info("Looking for baseline image for transformer: {} with condition: {}",
                    transformerNo, environmentalCondition);

            Transformer transformer = transformerRepository.findByTransformerNo(transformerNo)
                    .orElseThrow(() -> new RuntimeException("Transformer not found: " + transformerNo));

            List<TransformerImage> images = transformerImageRepository
                    .findByTransformerIdAndWeatherCondition(
                            transformer.getId(),
                            environmentalCondition.toUpperCase()
                    );

            if (images.isEmpty()) {
                log.error("No baseline image found for transformer {} with condition {}", transformerNo, environmentalCondition);
                return null;
            }

            String baselineUrl = images.get(0).getBaseImageUrl();
            log.info("Found baseline image: {}", baselineUrl);
            return baselineUrl;

        } catch (Exception e) {
            log.error("Error retrieving baseline image: {}", e.getMessage());
            throw new RuntimeException("Failed to retrieve baseline image", e);
        }
    }

    /**
     * Call Python inference API
     */
    private Map<String, Object> callPythonInference(
            String baselineUrl,
            String maintenanceUrl,
            String inspectionId,
            Double thresholdPct,
            Double iouThresh,
            Double confThresh
    ) {
        try {
            String url = pythonApiUrl + "/api/inference/run";

            Map<String, Object> request = new HashMap<>();
            request.put("baseline_url", baselineUrl);
            request.put("maintenance_url", maintenanceUrl);
            request.put("inspection_id", inspectionId);
            // Use provided thresholds if present; otherwise apply defaults
            request.put("threshold_pct", thresholdPct != null ? thresholdPct : 5.0);
            request.put("iou_thresh",   iouThresh    != null ? iouThresh    : 1.0);
            request.put("conf_thresh",  confThresh   != null ? confThresh   : 0.50);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            log.info("Calling Python inference API: {}", url);
            log.info("Request: baseline={}, maintenance={}", baselineUrl, maintenanceUrl);


            @SuppressWarnings("rawtypes")
            Map response = restTemplate.postForObject(url, entity, Map.class);

            @SuppressWarnings("unchecked")
            Map<String, Object> result = (Map<String, Object>) response.get("inference_result");
            return result;

        } catch (Exception e) {
            log.error("Failed to call Python inference API: {}", e.getMessage());
            throw new RuntimeException("Python inference API call failed", e);
        }
    }

    /**
     * Save inference results to database
     * @param inspectionId Long ID for database operations
     */
    private void saveInferenceResults(Long inspectionId, Map<String, Object> inferenceResult,
                                      String baselineUrl, String maintenanceUrl) {
        try {
            // Note: Old anomalies and metadata are already deleted in processAndInfer()
            // This method only creates new inference data
            
            // Find existing metadata or create new one
            InferenceMetadata metadata = inferenceMetadataRepository.findByInspectionId(inspectionId)
                    .orElse(new InferenceMetadata());
            
            // Set/update metadata fields
            metadata.setInspectionId(inspectionId);
            metadata.setBaselineImageUrl(baselineUrl);
            metadata.setMaintenanceImageUrl(maintenanceUrl);

            // Extract threshold values from the JSON result
            // threshold_pct comes from top-level params.thresholding.value
            @SuppressWarnings("unchecked")
            Map<String, Object> topLevelParams = (Map<String, Object>) inferenceResult.get("params");
            if (topLevelParams != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> thresholding = (Map<String, Object>) topLevelParams.get("thresholding");
                if (thresholding != null) {
                    Object thresholdPct = thresholding.get("value");
                    if (thresholdPct instanceof Number) {
                        metadata.setThresholdPct(((Number) thresholdPct).doubleValue());
                    }
                }
            }

            // iou_thresh and conf_thresh come from detector_summary.params
            @SuppressWarnings("unchecked")
            Map<String, Object> detectorSummary = (Map<String, Object>) inferenceResult.get("detector_summary");
            if (detectorSummary != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> params = (Map<String, Object>) detectorSummary.get("params");
                if (params != null) {
                    Object iouThresh = params.get("iou_thresh");
                    if (iouThresh instanceof Number) {
                        metadata.setIouThresh(((Number) iouThresh).doubleValue());
                    }
                    Object confThresh = params.get("conf_thresh");
                    if (confThresh instanceof Number) {
                        metadata.setConfThresh(((Number) confThresh).doubleValue());
                    }
                }
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> registration = (Map<String, Object>) inferenceResult.get("registration");
            if (registration != null) {
                metadata.setRegistrationOk((Boolean) registration.get("ok"));
                metadata.setRegistrationMethod((String) registration.get("method"));
                Object inliers = registration.get("inliers");
                if (inliers instanceof Number) {
                    metadata.setRegistrationInliers(((Number) inliers).intValue());
                } else if (inliers != null) {
                    try { metadata.setRegistrationInliers(Integer.parseInt(inliers.toString())); } catch (Exception ignore) {}
                }
            }
            metadata.setInferenceRunAt(LocalDateTime.now());
            
            // Set createdAt only if it's a new record
            if (metadata.getCreatedAt() == null) {
                metadata.setCreatedAt(LocalDateTime.now());
            }

            inferenceMetadataRepository.save(metadata);
            log.info("Saved inference metadata for inspection {}", inspectionId);

            // Save ALL detections from YOLO (supervised detections) - including normal
            if (detectorSummary != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> detections = (List<Map<String, Object>>) detectorSummary.get("detections");
                if (detections != null) {
                    int savedCount = 0;

                    for (Map<String, Object> detection : detections) {
                        String className = (String) detection.get("class_name");

                        InspectionAnomaly anomaly = new InspectionAnomaly();
                        anomaly.setInspectionId(inspectionId);  // Now sets Long
                        anomaly.setFaultType(className);
                        
                        // Mark as AI-generated and active
                        anomaly.setSource(com.powergrid.maintenance.tms_backend_application.inspection.model.AnomalySource.AI_GENERATED);
                        anomaly.setIsActive(true);

                        Object conf = detection.get("conf");
                        if (conf instanceof Number) {
                            anomaly.setFaultConfidence(((Number) conf).doubleValue());
                        }

                        Object classId = detection.get("class_id");
                        if (classId instanceof Number) {
                            anomaly.setClassId(((Number) classId).intValue());
                        }

                        // Extract bbox coordinates from bbox_xywh
                        @SuppressWarnings("unchecked")
                        List<Number> bboxXywh = (List<Number>) detection.get("bbox_xywh");
                        if (bboxXywh != null && bboxXywh.size() >= 4) {
                            int bboxX = bboxXywh.get(0).intValue();
                            int bboxY = bboxXywh.get(1).intValue();
                            int bboxWidth = bboxXywh.get(2).intValue();
                            int bboxHeight = bboxXywh.get(3).intValue();

                            anomaly.setBboxX(bboxX);
                            anomaly.setBboxY(bboxY);
                            anomaly.setBboxWidth(bboxWidth);
                            anomaly.setBboxHeight(bboxHeight);

                            // Calculate centroid and area
                            anomaly.setCentroidX(bboxX + bboxWidth / 2.0);
                            anomaly.setCentroidY(bboxY + bboxHeight / 2.0);
                            anomaly.setAreaPx(bboxWidth * bboxHeight);
                        }

                        anomalyRepository.save(anomaly);
                        savedCount++;
                    }

                    log.info("Saved {} detections for inspection {} (including normal and faults)",
                            savedCount, inspectionId);
                }
            }

        } catch (Exception e) {
            log.error("Failed to upsert inference results: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save inference results", e);
        }
    }
}
