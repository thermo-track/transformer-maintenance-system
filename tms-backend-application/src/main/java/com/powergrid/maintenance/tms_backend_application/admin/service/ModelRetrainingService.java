package com.powergrid.maintenance.tms_backend_application.admin.service;

import com.powergrid.maintenance.tms_backend_application.admin.dto.RetrainingRequest;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnnotationAction;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.repository.AnnotationActionRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for managing model retraining operations.
 * For now, this is a basic implementation. You can enhance it later with:
 * - Database persistence for training jobs
 * - Background job execution
 * - Metrics tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ModelRetrainingService {

    // In-memory storage for job status (use database in production)
    private final Map<String, Map<String, Object>> jobStatusMap = new HashMap<>();
    
    private final AnnotationActionRepository annotationActionRepository;
    private final InspectionRepo inspectionRepo;
    
    /**
     * Get all annotation actions for retraining review
     * Returns annotations grouped with inspection metadata
     */
    public Map<String, Object> getAllAnnotationActions() {
        log.info("Fetching all annotation actions");
        
        try {
            // Get all annotation actions ordered by timestamp (newest first)
            List<AnnotationAction> actions = annotationActionRepository.findAll();
            actions.sort((a, b) -> b.getActionTimestamp().compareTo(a.getActionTimestamp()));
            
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
            
            log.info("Fetched {} annotation actions", enrichedActions.size());
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
     * Get statistics about available corrections and training readiness
     */
    public Map<String, Object> getRetrainingStats() {
        Map<String, Object> stats = new HashMap<>();
        
        // Query actual annotation action count
        long totalActions = annotationActionRepository.count();
        
        stats.put("totalCorrections", totalActions);
        stats.put("readyForTraining", totalActions >= 20);
        stats.put("minimumRequired", 20);
        stats.put("lastTrainingDate", null);
        stats.put("currentModelVersion", "1.0");
        
        return stats;
    }

    /**
     * Get count of corrections available for training
     */
    public int getCorrectionCount() {
        // TODO: Implement actual query to count corrections from database
        // Example:
        // return annotationRepository.countByStatusAndCreatedAtAfter("APPROVED", lastTrainingDate);
        return 0; // Placeholder
    }

    /**
     * Trigger retraining process
     * This is a simplified version - you can enhance it to actually spawn the Python process
     */
    public String triggerRetraining(RetrainingRequest request) {
        String jobId = UUID.randomUUID().toString();
        log.info("Starting retraining job: {}", jobId);
        
        // Create job status entry
        Map<String, Object> jobStatus = new HashMap<>();
        jobStatus.put("jobId", jobId);
        jobStatus.put("status", "PENDING");
        jobStatus.put("createdAt", LocalDateTime.now().toString());
        jobStatus.put("startedAt", null);
        jobStatus.put("completedAt", null);
        jobStatus.put("progress", 0);
        jobStatus.put("request", request);
        jobStatus.put("error", null);
        jobStatus.put("metrics", null);
        
        jobStatusMap.put(jobId, jobStatus);
        
        // TODO: In production, you would:
        // 1. Export corrections from database to Phase 3 format
        // 2. Spawn Python training process
        // 3. Monitor progress
        // 4. Update job status
        
        // For now, just log and mark as completed immediately (for testing)
        log.info("Retraining job {} created. In production, this would spawn Phase 3 training script.", jobId);
        log.info("Command would be: python -m phase3_fault_type.incremental_finetune --epochs {} --feedback-replay {} --original-replay {} --device {}",
                request.getEpochs(), request.getFeedbackReplay(), request.getOriginalReplay(), request.getDevice());
        
        // Simulate job completion (remove this in production)
        jobStatus.put("status", "COMPLETED");
        jobStatus.put("completedAt", LocalDateTime.now().toString());
        jobStatus.put("progress", 100);
        jobStatus.put("message", "Training job created. Implement actual Python process spawning for production.");
        
        return jobId;
    }

    /**
     * Get status of a training job
     */
    public Map<String, Object> getJobStatus(String jobId) {
        return jobStatusMap.get(jobId);
    }

    /**
     * Get history of recent retraining jobs
     */
    public List<Map<String, Object>> getRetrainingHistory(int limit) {
        // In production, query from database
        List<Map<String, Object>> history = new ArrayList<>(jobStatusMap.values());
        
        // Sort by creation date (most recent first)
        history.sort((a, b) -> {
            String dateA = (String) a.get("createdAt");
            String dateB = (String) b.get("createdAt");
            return dateB.compareTo(dateA);
        });
        
        // Limit results
        return history.subList(0, Math.min(limit, history.size()));
    }
}
