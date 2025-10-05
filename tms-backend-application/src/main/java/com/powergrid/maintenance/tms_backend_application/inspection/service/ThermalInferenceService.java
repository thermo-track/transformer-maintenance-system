package com.powergrid.maintenance.tms_backend_application.inspection.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InferenceMetadata;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageMetadataDTO;
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

    public Map<String, Object> processAndInfer(String inspectionId, ImageMetadataDTO imageMetadata) {

        // 1. Update inspection with cloud image info
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found: " + inspectionId));

        inspection.setCloudImageUrl(imageMetadata.getCloudImageUrl());
        inspection.setCloudinaryPublicId(imageMetadata.getCloudinaryPublicId());
        inspection.setCloudImageName(imageMetadata.getCloudImageName());
        inspection.setCloudImageType(imageMetadata.getCloudImageType());
        inspection.setEnvironmentalCondition(imageMetadata.getEnvironmentalCondition());
        inspection.setCloudUploadedAt(imageMetadata.getCloudUploadedAt());

        inspectionRepository.save(inspection);
        log.info("Updated inspection {} with cloud image metadata", inspectionId);

        // 2. Get baseline image URL for this transformer and weather condition
        String baselineUrl = getBaselineImageUrl(inspection.getTransformerNo(), imageMetadata.getEnvironmentalCondition());

        if (baselineUrl == null) {
            throw new RuntimeException("No baseline image found for transformer " +
                    inspection.getTransformerNo() + " with condition " + imageMetadata.getEnvironmentalCondition());
        }

        // 3. Call Python inference API
        Map<String, Object> inferenceResult = callPythonInference(
                baselineUrl,
                imageMetadata.getCloudImageUrl(),
                inspectionId
        );

        // 4. Save inference results to database
        saveInferenceResults(inspectionId, inferenceResult, baselineUrl, imageMetadata.getCloudImageUrl());

        // 5. Return combined response
        Map<String, Object> response = new HashMap<>();
        response.put("metadata", imageMetadata);
        response.put("inference", inferenceResult);

        return response;
    }

    private String getBaselineImageUrl(String transformerNo, String environmentalCondition) {
        try {
            log.info("Looking for baseline image for transformer: {} with condition: {}",
                    transformerNo, environmentalCondition);

            // Get transformer by transformer number
            Transformer transformer = transformerRepository.findByTransformerNo(transformerNo)
                    .orElseThrow(() -> new RuntimeException("Transformer not found: " + transformerNo));

            // Get baseline image for this transformer and weather condition
            List<TransformerImage> images = transformerImageRepository
                    .findByTransformerIdAndWeatherCondition(
                            transformer.getId(),
                            environmentalCondition.toUpperCase()
                    );

            if (images.isEmpty()) {
                log.error("No baseline image found for transformer {} with condition {}",
                        transformerNo, environmentalCondition);
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

    private Map<String, Object> callPythonInference(String baselineUrl, String maintenanceUrl, String inspectionId) {
        try {
            String url = pythonApiUrl + "/api/inference/run";

            Map<String, Object> request = new HashMap<>();
            request.put("baseline_url", baselineUrl);
            request.put("maintenance_url", maintenanceUrl);
            request.put("inspection_id", inspectionId);
            request.put("threshold_pct", 2.0);
            request.put("iou_thresh", 0.35);
            request.put("conf_thresh", 0.25);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            log.info("Calling Python inference API: {}", url);
            log.info("Request: baseline={}, maintenance={}", baselineUrl, maintenanceUrl);

            Map response = restTemplate.postForObject(url, entity, Map.class);

            return (Map<String, Object>) response.get("inference_result");

        } catch (Exception e) {
            log.error("Failed to call Python inference API: {}", e.getMessage());
            throw new RuntimeException("Python inference API call failed", e);
        }
    }

    private void saveInferenceResults(String inspectionId, Map<String, Object> inferenceResult,
                                      String baselineUrl, String maintenanceUrl) {
        try {
            // Check if metadata already exists and delete it
            inferenceMetadataRepository.findByInspectionId(inspectionId)
                    .ifPresent(existingMetadata -> {
                        log.info("Deleting existing inference metadata for inspection {}", inspectionId);
                        inferenceMetadataRepository.delete(existingMetadata);
                    });

            // Delete existing anomalies
            List<InspectionAnomaly> existingAnomalies = anomalyRepository.findByInspectionId(inspectionId);
            if (!existingAnomalies.isEmpty()) {
                log.info("Deleting {} existing anomalies for inspection {}", existingAnomalies.size(), inspectionId);
                anomalyRepository.deleteAll(existingAnomalies);
            }

            // Now save new metadata
            InferenceMetadata metadata = new InferenceMetadata();
            metadata.setInspectionId(inspectionId);
            metadata.setBaselineImageUrl(baselineUrl);
            metadata.setMaintenanceImageUrl(maintenanceUrl);

            Map<String, Object> registration = (Map<String, Object>) inferenceResult.get("registration");
            if (registration != null) {
                metadata.setRegistrationOk((Boolean) registration.get("ok"));
                metadata.setRegistrationMethod((String) registration.get("method"));
                metadata.setRegistrationInliers((Integer) registration.get("inliers"));
            }

            metadata.setFullJsonResult(objectMapper.writeValueAsString(inferenceResult));
            metadata.setInferenceRunAt(LocalDateTime.now());

            inferenceMetadataRepository.save(metadata);
            log.info("Saved inference metadata for inspection {}", inspectionId);

            // Save anomalies (unsupervised detections)
            List<Map<String, Object>> anomalies = (List<Map<String, Object>>) inferenceResult.get("anomalies");
            if (anomalies != null) {
                for (Map<String, Object> anomalyData : anomalies) {
                    InspectionAnomaly anomaly = new InspectionAnomaly();
                    anomaly.setInspectionId(inspectionId);

                    List<Number> bbox = (List<Number>) anomalyData.get("bbox");
                    if (bbox != null && bbox.size() >= 4) {
                        anomaly.setBboxX(bbox.get(0).intValue());
                        anomaly.setBboxY(bbox.get(1).intValue());
                        anomaly.setBboxWidth(bbox.get(2).intValue());
                        anomaly.setBboxHeight(bbox.get(3).intValue());
                    }

                    List<Number> centroid = (List<Number>) anomalyData.get("centroid");
                    if (centroid != null && centroid.size() >= 2) {
                        anomaly.setCentroidX(centroid.get(0).doubleValue());
                        anomaly.setCentroidY(centroid.get(1).doubleValue());
                    }

                    Object areaPx = anomalyData.get("area_px");
                    if (areaPx instanceof Number) {
                        anomaly.setAreaPx(((Number) areaPx).intValue());
                    }

                    anomalyRepository.save(anomaly);
                }
                log.info("Saved {} anomalies for inspection {}", anomalies.size(), inspectionId);
            }

            // Save detections from YOLO (supervised detections)
            Map<String, Object> detectorSummary = (Map<String, Object>) inferenceResult.get("detector_summary");
            if (detectorSummary != null) {
                List<Map<String, Object>> detections = (List<Map<String, Object>>) detectorSummary.get("detections");
                if (detections != null) {
                    for (Map<String, Object> detection : detections) {
                        InspectionAnomaly anomaly = new InspectionAnomaly();
                        anomaly.setInspectionId(inspectionId);

                        // Set fault type and confidence
                        anomaly.setFaultType((String) detection.get("class_name"));
                        Object conf = detection.get("conf");
                        if (conf instanceof Number) {
                            anomaly.setFaultConfidence(((Number) conf).doubleValue());
                        }

                        Object classId = detection.get("class_id");
                        if (classId instanceof Number) {
                            anomaly.setClassId(((Number) classId).intValue());
                        }

                        // CRITICAL FIX: Extract bbox coordinates from bbox_xywh
                        List<Number> bboxXywh = (List<Number>) detection.get("bbox_xywh");
                        if (bboxXywh != null && bboxXywh.size() >= 4) {
                            anomaly.setBboxX(bboxXywh.get(0).intValue());
                            anomaly.setBboxY(bboxXywh.get(1).intValue());
                            anomaly.setBboxWidth(bboxXywh.get(2).intValue());
                            anomaly.setBboxHeight(bboxXywh.get(3).intValue());

                            // Store the original bbox for reference if needed
                            anomaly.setDetectorBox(objectMapper.writeValueAsString(bboxXywh));
                        }

                        anomalyRepository.save(anomaly);
                    }
                    log.info("Saved {} detections for inspection {}", detections.size(), inspectionId);
                }
            }

        } catch (Exception e) {
            log.error("Failed to save inference results: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save inference results", e);
        }
    }
}