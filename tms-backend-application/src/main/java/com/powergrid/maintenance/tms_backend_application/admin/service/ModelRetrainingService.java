package com.powergrid.maintenance.tms_backend_application.admin.service;

import com.powergrid.maintenance.tms_backend_application.admin.domain.RetrainingHistory;
import com.powergrid.maintenance.tms_backend_application.admin.repository.RetrainingHistoryRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnnotationAction;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InferenceMetadata;
import com.powergrid.maintenance.tms_backend_application.inspection.model.ActionType;
import com.powergrid.maintenance.tms_backend_application.inspection.repository.AnnotationActionRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InferenceMetadataRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionAnomalyRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing model retraining operations.
 * Handles incremental fine-tuning with user corrections.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ModelRetrainingService {

    private final AnnotationActionRepository annotationActionRepository;
    private final InspectionRepo inspectionRepo;
    private final InspectionAnomalyRepository anomalyRepository;
    private final InferenceMetadataRepository inferenceMetadataRepository;
    private final RetrainingHistoryRepository retrainingHistoryRepository;
    private final RestTemplate restTemplate;

    @Value("${finetune.service.url:http://localhost:8002}")
    private String finetuneServiceUrl;
    
    /**
     * Get annotation actions since last retraining for display
     * Returns annotations grouped with inspection metadata
     */
    public Map<String, Object> getAllAnnotationActions() {
        log.info("Fetching annotation actions since last retraining");
        
        try {
            // Get last completed retraining timestamp
            LocalDateTime sinceTimestamp = retrainingHistoryRepository
                    .findLastCompletedTimestamp()
                    .orElse(LocalDateTime.of(2000, 1, 1, 0, 0)); // Start of time if no retraining yet
            
            log.info("Fetching actions since: {}", sinceTimestamp);
            
            // Get all annotation actions after last retraining
            List<AnnotationAction> actions = annotationActionRepository.findAll().stream()
                    .filter(a -> a.getActionTimestamp().isAfter(sinceTimestamp))
                    .sorted((a, b) -> b.getActionTimestamp().compareTo(a.getActionTimestamp()))
                    .collect(Collectors.toList());
            
            // Enrich with inspection metadata
            Map<Long, Inspection> inspectionCache = new HashMap<>();
            List<Map<String, Object>> enrichedActions = new ArrayList<>();
            
            for (AnnotationAction action : actions) {
                Map<String, Object> actionData = new HashMap<>();
                
                // Basic action info
                actionData.put("id", action.getId());
                actionData.put("anomalyId", action.getAnomalyId());
                actionData.put("inspectionId", action.getInspectionId());
                actionData.put("actionType", action.getActionType());
                actionData.put("username", action.getUsername());
                actionData.put("actionTimestamp", action.getActionTimestamp());
                actionData.put("comment", action.getComment());
                
                // Before/After data
                actionData.put("previousBbox", action.getPreviousBbox());
                actionData.put("newBbox", action.getNewBbox());
                actionData.put("previousClassification", action.getPreviousClassification());
                actionData.put("newClassification", action.getNewClassification());
                
                // Get inspection metadata (with caching)
                Long inspectionId = action.getInspectionId();
                if (!inspectionCache.containsKey(inspectionId)) {
                    inspectionRepo.findById(inspectionId)
                            .ifPresent(insp -> inspectionCache.put(inspectionId, insp));
                }
                
                Inspection inspection = inspectionCache.get(inspectionId);
                if (inspection != null) {
                    actionData.put("transformerId", inspection.getTransformerNo());
                    actionData.put("transformerName", inspection.getTransformer() != null ? 
                            inspection.getTransformer().getLocationDetails() : "Unknown");
                } else {
                    actionData.put("transformerId", "N/A");
                    actionData.put("transformerName", "Unknown");
                }
                
                enrichedActions.add(actionData);
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("annotations", enrichedActions);
            result.put("total", enrichedActions.size());
            result.put("sinceTimestamp", sinceTimestamp);
            
            log.info("Fetched {} annotation actions since {}", enrichedActions.size(), sinceTimestamp);
            return result;
            
        } catch (Exception e) {
            log.error("Error fetching annotation actions", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            errorResult.put("annotations", Collections.emptyList());
            errorResult.put("total", 0);
            return errorResult;
        }
    }
    
    /**
     * Get inspections affected by user actions (for fine-tuning)
     * Only includes inspections with CREATED, EDITED, DELETED, or REJECTED actions
     * Excludes APPROVED and COMMENTED only actions
     */
    private Set<Long> getAffectedInspections(LocalDateTime since) {
        List<AnnotationAction> actions = annotationActionRepository.findAll().stream()
                .filter(a -> a.getActionTimestamp().isAfter(since))
                .collect(Collectors.toList());
        
        // Group actions by inspection
        Map<Long, List<ActionType>> inspectionActions = new HashMap<>();
        for (AnnotationAction action : actions) {
            inspectionActions.computeIfAbsent(action.getInspectionId(), k -> new ArrayList<>())
                    .add(action.getActionType());
        }
        
        // Filter to only include inspections with meaningful actions
        Set<Long> affectedInspections = new HashSet<>();
        for (Map.Entry<Long, List<ActionType>> entry : inspectionActions.entrySet()) {
            List<ActionType> actionTypes = entry.getValue();
            
            // Check if there are any non-passive actions
            boolean hasSignificantAction = actionTypes.stream()
                    .anyMatch(type -> type == ActionType.CREATED || 
                                     type == ActionType.EDITED || 
                                     type == ActionType.DELETED ||
                                     type == ActionType.REJECTED);
            
            if (hasSignificantAction) {
                affectedInspections.add(entry.getKey());
            }
        }
        
        log.info("Found {} affected inspections with user corrections", affectedInspections.size());
        return affectedInspections;
    }
    
    /**
     * Export fine-tuning data in format expected by Python service
     * Includes ALL active anomalies for affected inspections
     */
    private Map<String, Object> exportFinetuningData(String username) {
        LocalDateTime since = retrainingHistoryRepository
                .findLastCompletedTimestamp()
                .orElse(LocalDateTime.of(2000, 1, 1, 0, 0));
        
        Set<Long> affectedInspections = getAffectedInspections(since);
        
        if (affectedInspections.isEmpty()) {
            log.warn("No affected inspections found for retraining");
            return Map.of("images", Collections.emptyList());
        }
        
        List<Map<String, Object>> images = new ArrayList<>();
        int totalDetections = 0;
        
        for (Long inspectionId : affectedInspections) {
            // Get image URL from inference metadata
            Optional<InferenceMetadata> metadataOpt = inferenceMetadataRepository.findByInspectionId(inspectionId);
            if (!metadataOpt.isPresent() || metadataOpt.get().getMaintenanceImageUrl() == null) {
                log.warn("No image URL found for inspection {}, skipping", inspectionId);
                continue;
            }
            
            String imageUrl = metadataOpt.get().getMaintenanceImageUrl();
            
            // Get ALL active anomalies for this inspection (AI + User)
            List<InspectionAnomaly> activeAnomalies = anomalyRepository.findByInspectionIdAndIsActiveTrue(inspectionId);
            
            if (activeAnomalies.isEmpty()) {
                log.warn("No active anomalies for inspection {}, skipping", inspectionId);
                continue;
            }
            
            // Convert to Python format
            List<Map<String, Object>> detections = new ArrayList<>();
            for (InspectionAnomaly anomaly : activeAnomalies) {
                // Convert bbox format: (x, y, width, height) -> (x_min, y_min, x_max, y_max)
                Map<String, Object> box = new HashMap<>();
                box.put("x_min", anomaly.getBboxX());
                box.put("y_min", anomaly.getBboxY());
                box.put("x_max", anomaly.getBboxX() + anomaly.getBboxWidth());
                box.put("y_max", anomaly.getBboxY() + anomaly.getBboxHeight());
                
                Map<String, Object> detection = new HashMap<>();
                detection.put("box", box);
                detection.put("class_id", anomaly.getClassId());
                
                detections.add(detection);
            }
            
            Map<String, Object> imageData = new HashMap<>();
            imageData.put("image_url", imageUrl);
            imageData.put("detections", detections);
            
            images.add(imageData);
            totalDetections += detections.size();
        }
        
        log.info("Exported {} images with {} total detections for retraining", images.size(), totalDetections);
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("images", images);
        payload.put("train_replay", 50); // Mix in baseline samples
        payload.put("epochs", 10);
        
        return payload;
    }
    
    /**
     * Trigger incremental retraining with user corrections
     */
    @Transactional
    public String triggerRetraining(String username) {
        log.info("Starting incremental retraining triggered by user: {}", username);
        
        String runId = UUID.randomUUID().toString();
        
        // Create retraining history record
        RetrainingHistory history = new RetrainingHistory();
        history.setRunId(runId);
        history.setStatus("RUNNING");
        history.setStartedAt(LocalDateTime.now());
        history.setTriggeredBy(username);
        
        try {
            // Export data
            Map<String, Object> payload = exportFinetuningData(username);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> images = (List<Map<String, Object>>) payload.get("images");
            
            if (images.isEmpty()) {
                history.setStatus("FAILED");
                history.setCompletedAt(LocalDateTime.now());
                history.setErrorMessage("No images available for retraining");
                retrainingHistoryRepository.save(history);
                return runId;
            }
            
            // Count total detections
            int totalDetections = 0;
            for (Map<String, Object> img : images) {
                @SuppressWarnings("unchecked")
                List<?> dets = (List<?>) img.get("detections");
                totalDetections += dets.size();
            }
            
            history.setImagesCount(images.size());
            history.setActionsIncluded(totalDetections);
            retrainingHistoryRepository.save(history);
            
            // Call Python fine-tuning service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
            
            String endpoint = finetuneServiceUrl + "/api/finetune";
            log.info("Calling Python service at: {}", endpoint);
            
            ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                    endpoint, request, 
                    (Class<Map<String, Object>>)(Class<?>)Map.class
            );
            
            // Update history with results
            history.setStatus("COMPLETED");
            history.setCompletedAt(LocalDateTime.now());
            
            if (response.getBody() != null) {
                Map<String, Object> result = response.getBody();
                history.setWeightsPath((String) result.get("weights_path"));
                
                // Store metrics as JSON
                if (result.containsKey("metrics")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> metricsMap = (Map<String, Object>) result.get("metrics");
                    history.setMetrics(metricsMap);
                }
                
                // Store hyperparameters
                Map<String, Object> hyperparams = new HashMap<>();
                hyperparams.put("epochs", payload.get("epochs"));
                hyperparams.put("train_replay", payload.get("train_replay"));
                history.setHyperparameters(hyperparams);
            }
            
            retrainingHistoryRepository.save(history);
            log.info("Retraining completed successfully: {}", runId);
            
        } catch (Exception e) {
            log.error("Retraining failed: {}", e.getMessage(), e);
            history.setStatus("FAILED");
            history.setCompletedAt(LocalDateTime.now());
            history.setErrorMessage(e.getMessage());
            retrainingHistoryRepository.save(history);
        }
        
        return runId;
    }
    
    /**
     * Get statistics about available corrections and training readiness
     */
    public Map<String, Object> getRetrainingStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Get last retraining timestamp
        LocalDateTime lastRetraining = retrainingHistoryRepository
                .findLastCompletedTimestamp()
                .orElse(null);
        
        // Count actions since last retraining
        long newActions = lastRetraining != null ? 
                annotationActionRepository.findAll().stream()
                        .filter(a -> a.getActionTimestamp().isAfter(lastRetraining))
                        .count() :
                annotationActionRepository.count();
        
        stats.put("totalCorrections", newActions);
        stats.put("readyForTraining", newActions >= 5);
        stats.put("minimumRequired", 5);
        stats.put("lastTrainingDate", lastRetraining);
        
        // Get latest retraining info
        retrainingHistoryRepository.findLatestCompleted()
                .ifPresent(history -> {
                    stats.put("lastRunId", history.getRunId());
                    stats.put("lastWeightsPath", history.getWeightsPath());
                });
        
        return stats;
    }

    /**
     * Get status of a retraining run
     */
    public Optional<RetrainingHistory> getRetrainingStatus(String runId) {
        return retrainingHistoryRepository.findByRunId(runId);
    }

    /**
     * Get history of recent retraining runs
     */
    public List<RetrainingHistory> getRetrainingHistory(int limit) {
        return retrainingHistoryRepository.findAll().stream()
                .sorted((a, b) -> b.getStartedAt().compareTo(a.getStartedAt()))
                .limit(limit)
                .collect(Collectors.toList());
    }
}
