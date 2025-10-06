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
    private final ObjectMapper objectMapper;

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

            // 2. Determine env (prefer DTO, else persisted inspection) and fetch baseline URL
            String env = imageMetadata.getEnvironmentalCondition() != null
                    ? imageMetadata.getEnvironmentalCondition()
                    : inspection.getEnvironmentalCondition();

            String baselineUrl = getBaselineImageUrl(inspection.getTransformerNo(), env);

            if (baselineUrl == null) {
                throw new RuntimeException("No baseline image found for transformer " +
                        inspection.getTransformerNo() + " with condition " + env);
            }

            // 3. Call Python inference API with thresholds (DTO values or defaults)
            // Note: Python API can still receive string ID if needed
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

            // 5. Return combined response
            Map<String, Object> response = new HashMap<>();
            response.put("metadata", imageMetadata);
            response.put("inference", inferenceResult);
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
            request.put("threshold_pct", thresholdPct != null ? thresholdPct : 2.0);
            request.put("iou_thresh",   iouThresh    != null ? iouThresh    : 0.35);
            request.put("conf_thresh",  confThresh   != null ? confThresh   : 0.25);

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
            // Delete existing anomalies first
            List<InspectionAnomaly> existingAnomalies = anomalyRepository.findByInspectionId(inspectionId);
            if (!existingAnomalies.isEmpty()) {
                log.info("Deleting {} existing anomalies for inspection {}", existingAnomalies.size(), inspectionId);
                anomalyRepository.deleteAll(existingAnomalies);
            }

            // Find existing metadata or create new one
            InferenceMetadata metadata = inferenceMetadataRepository.findByInspectionId(inspectionId)
                    .orElse(new InferenceMetadata());
            
            // Set/update metadata fields
            metadata.setInspectionId(inspectionId);  
            metadata.setBaselineImageUrl(baselineUrl);
            metadata.setMaintenanceImageUrl(maintenanceUrl);

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

            metadata.setFullJsonResult(objectMapper.writeValueAsString(inferenceResult));
            metadata.setInferenceRunAt(LocalDateTime.now());
            
            // Set createdAt only if it's a new record
            if (metadata.getCreatedAt() == null) {
                metadata.setCreatedAt(LocalDateTime.now());
            }

            inferenceMetadataRepository.save(metadata);
            log.info("Saved inference metadata for inspection {}", inspectionId);

            // Save detections from YOLO (supervised detections) - ONLY FAULTS
            @SuppressWarnings("unchecked")
            Map<String, Object> detectorSummary = (Map<String, Object>) inferenceResult.get("detector_summary");
            if (detectorSummary != null) {
                @SuppressWarnings("unchecked")

                List<Map<String, Object>> detections = (List<Map<String, Object>>) detectorSummary.get("detections");
                if (detections != null) {
                    int savedCount = 0;
                    int skippedCount = 0;

                    for (Map<String, Object> detection : detections) {
                        String className = (String) detection.get("class_name");

                        // CRITICAL: Skip "normal" detections - only save actual faults
                        if (className != null && className.toLowerCase().contains("normal")) {
                            log.debug("Skipping normal detection: {} with confidence {}",
                                    className, detection.get("conf"));
                            skippedCount++;
                            continue;
                        }

                        InspectionAnomaly anomaly = new InspectionAnomaly();
                        anomaly.setInspectionId(inspectionId);  // Now sets Long
                        anomaly.setFaultType(className);

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
                            anomaly.setBboxX(bboxXywh.get(0).intValue());
                            anomaly.setBboxY(bboxXywh.get(1).intValue());
                            anomaly.setBboxWidth(bboxXywh.get(2).intValue());
                            anomaly.setBboxHeight(bboxXywh.get(3).intValue());
                            anomaly.setDetectorBox(objectMapper.writeValueAsString(bboxXywh));
                        }

                        anomalyRepository.save(anomaly);
                        savedCount++;
                    }

                    log.info("Saved {} fault detections for inspection {} (skipped {} normal detections)",
                            savedCount, inspectionId, skippedCount);
                }
            }

        } catch (Exception e) {
            log.error("Failed to upsert inference results: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save inference results", e);
        }
    }
}
