package com.powergrid.maintenance.tms_backend_application.inspection.service;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnnotationAction;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnomalyNote;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.*;
import com.powergrid.maintenance.tms_backend_application.inspection.model.ActionType;
import com.powergrid.maintenance.tms_backend_application.inspection.model.AnomalySource;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionAnomalyRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repository.AnnotationActionRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.AnomalyNoteRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing annotation feedback and user interactions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AnnotationService {

    private final InspectionAnomalyRepository anomalyRepository;
    private final AnnotationActionRepository actionRepository;
    private final AnomalyNoteRepository noteRepository;
    private final InspectionRepo inspectionRepo;

    /**
     * Get all annotations for an inspection (AI + User, active + inactive)
     */
    public AnnotationViewDTO getAnnotationsForInspection(Long inspectionId) {
        log.debug("Fetching all annotations for inspection: {}", inspectionId);

        List<InspectionAnomaly> allAnomalies = anomalyRepository
                .findByInspectionIdOrderByCreatedAtDesc(inspectionId);

        // Separate into categories
        List<InspectionAnomaly> aiDetections = allAnomalies.stream()
                .filter(a -> a.getSource() == AnomalySource.AI_GENERATED && Boolean.TRUE.equals(a.getIsActive()))
                .collect(Collectors.toList());

        List<InspectionAnomaly> userAnnotations = allAnomalies.stream()
                .filter(a -> a.getSource() == AnomalySource.USER_ADDED && Boolean.TRUE.equals(a.getIsActive()))
                .collect(Collectors.toList());

        List<InspectionAnomaly> inactiveDetections = allAnomalies.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsActive()))
                .collect(Collectors.toList());

        AnnotationViewDTO result = new AnnotationViewDTO();
        result.setInspectionId(inspectionId);
        result.setAiDetections(aiDetections);
        result.setUserAnnotations(userAnnotations);
        result.setInactiveDetections(inactiveDetections);
        result.setTotalActive(aiDetections.size() + userAnnotations.size());
        result.setTotalInactive(inactiveDetections.size());

        log.debug("Found {} AI detections, {} user annotations, {} inactive",
                aiDetections.size(), userAnnotations.size(), inactiveDetections.size());

        return result;
    }

    /**
     * Create a new user annotation
     */
    @Transactional
    public InspectionAnomaly createUserAnnotation(AnnotationRequestDTO request, String username) {
        log.info("Creating new user annotation for inspection: {} by user: {}", 
                request.getInspectionId(), username);

        // Create new anomaly
        InspectionAnomaly anomaly = new InspectionAnomaly();
        anomaly.setInspectionId(request.getInspectionId());
        anomaly.setSource(AnomalySource.USER_ADDED);
        anomaly.setIsActive(true);
        anomaly.setCreatedBy(username);

        // Set geometry
        if (request.getGeometry() != null) {
            Integer bboxX = request.getGeometry().getX();
            Integer bboxY = request.getGeometry().getY();
            Integer bboxWidth = request.getGeometry().getWidth();
            Integer bboxHeight = request.getGeometry().getHeight();
            
            anomaly.setBboxX(bboxX);
            anomaly.setBboxY(bboxY);
            anomaly.setBboxWidth(bboxWidth);
            anomaly.setBboxHeight(bboxHeight);
            
            // Calculate centroid and area
            anomaly.setCentroidX(bboxX + bboxWidth / 2.0);
            anomaly.setCentroidY(bboxY + bboxHeight / 2.0);
            anomaly.setAreaPx(bboxWidth * bboxHeight);
        }

        // Set classification
        if (request.getClassification() != null) {
            anomaly.setFaultType(request.getClassification().getFaultType());
            anomaly.setFaultConfidence(request.getClassification().getConfidence());
            anomaly.setClassId(request.getClassification().getClassId());
        }

        anomaly = anomalyRepository.save(anomaly);

        // Log the action
        AnnotationAction action = createAction(
                anomaly.getId(),
                request.getInspectionId(),
                request.getUserId(),
                username,
                ActionType.CREATED,
                null,
                toBBoxData(anomaly),
                null,
                toClassificationData(anomaly),
                request.getComment()
        );
        actionRepository.save(action);

        log.info("Created user annotation with ID: {}", anomaly.getId());
        return anomaly;
    }

    /**
     * Edit an existing annotation (creates new, marks old as superseded)
     */
    @Transactional
    public InspectionAnomaly editAnnotation(Long anomalyId, AnnotationRequestDTO request, String username) {
        log.info("Editing annotation: {} by user: {}", anomalyId, username);

        // Get original anomaly
        InspectionAnomaly original = anomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new RuntimeException("Anomaly not found: " + anomalyId));

        // Store original data for audit
        BBoxData originalBbox = toBBoxData(original);
        ClassificationData originalClassification = toClassificationData(original);

        // Create new anomaly with edited data
        InspectionAnomaly newAnomaly = new InspectionAnomaly();
        newAnomaly.setInspectionId(original.getInspectionId());
        newAnomaly.setSource(AnomalySource.USER_ADDED); // Edited annotations are user-added
        newAnomaly.setIsActive(true);
        newAnomaly.setCreatedBy(username);

        // Set new geometry
        Integer bboxX, bboxY, bboxWidth, bboxHeight;
        if (request.getGeometry() != null) {
            bboxX = request.getGeometry().getX();
            bboxY = request.getGeometry().getY();
            bboxWidth = request.getGeometry().getWidth();
            bboxHeight = request.getGeometry().getHeight();
            
            newAnomaly.setBboxX(bboxX);
            newAnomaly.setBboxY(bboxY);
            newAnomaly.setBboxWidth(bboxWidth);
            newAnomaly.setBboxHeight(bboxHeight);
        } else {
            // Keep original geometry if not provided
            bboxX = original.getBboxX();
            bboxY = original.getBboxY();
            bboxWidth = original.getBboxWidth();
            bboxHeight = original.getBboxHeight();
            
            newAnomaly.setBboxX(bboxX);
            newAnomaly.setBboxY(bboxY);
            newAnomaly.setBboxWidth(bboxWidth);
            newAnomaly.setBboxHeight(bboxHeight);
        }
        
        // Calculate centroid and area
        newAnomaly.setCentroidX(bboxX + bboxWidth / 2.0);
        newAnomaly.setCentroidY(bboxY + bboxHeight / 2.0);
        newAnomaly.setAreaPx(bboxWidth * bboxHeight);

        // Set new classification
        if (request.getClassification() != null) {
            newAnomaly.setFaultType(request.getClassification().getFaultType());
            newAnomaly.setFaultConfidence(request.getClassification().getConfidence());
            newAnomaly.setClassId(request.getClassification().getClassId());
        } else {
            // Keep original classification if not provided
            newAnomaly.setFaultType(original.getFaultType());
            newAnomaly.setFaultConfidence(original.getFaultConfidence());
            newAnomaly.setClassId(original.getClassId());
        }

        newAnomaly = anomalyRepository.save(newAnomaly);

        // Mark original as superseded
        original.setIsActive(false);
        original.setSupersededBy(newAnomaly.getId());
        original.setSupersededAt(LocalDateTime.now());
        anomalyRepository.save(original);

        // Log the action
        AnnotationAction action = createAction(
                newAnomaly.getId(),
                original.getInspectionId(),
                request.getUserId(),
                username,
                ActionType.EDITED,
                originalBbox,
                toBBoxData(newAnomaly),
                originalClassification,
                toClassificationData(newAnomaly),
                request.getComment()
        );
        actionRepository.save(action);

        log.info("Edited annotation: old={}, new={}", anomalyId, newAnomaly.getId());
        return newAnomaly;
    }

    /**
     * Delete (soft delete) an annotation
     */
    @Transactional
    public void deleteAnnotation(Long anomalyId, String comment, Integer userId, String username) {
        log.info("Deleting annotation: {} by user: {}", anomalyId, username);

        InspectionAnomaly anomaly = anomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new RuntimeException("Anomaly not found: " + anomalyId));

        // Soft delete
        anomaly.setIsActive(false);
        anomalyRepository.save(anomaly);

        // Log the action
        AnnotationAction action = createAction(
                anomalyId,
                anomaly.getInspectionId(),
                userId,
                username,
                ActionType.DELETED,
                toBBoxData(anomaly),
                null,
                toClassificationData(anomaly),
                null,
                comment
        );
        actionRepository.save(action);

        log.info("Deleted annotation: {}", anomalyId);
    }

    /**
     * Add comment to an annotation
     */
    @Transactional
    public void addComment(Long anomalyId, String comment, Integer userId, String username) {
        log.info("Adding comment to annotation: {} by user: {}", anomalyId, username);

        InspectionAnomaly anomaly = anomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new RuntimeException("Anomaly not found: " + anomalyId));

        // Create anomaly note (existing functionality)
        AnomalyNote note = new AnomalyNote();
        note.setAnomalyId(anomalyId);
        note.setNote(comment);
        note.setCreatedBy(username);
        noteRepository.save(note);

        // Log the action
        AnnotationAction action = createAction(
                anomalyId,
                anomaly.getInspectionId(),
                userId,
                username,
                ActionType.COMMENTED,
                null,
                null,
                null,
                null,
                comment
        );
        actionRepository.save(action);

        log.info("Added comment to annotation: {}", anomalyId);
    }

    /**
     * Accept AI detection (log approval action)
     */
    @Transactional
    public void acceptAiDetection(Long anomalyId, Integer userId, String username) {
        log.info("Accepting AI detection: {} by user: {}", anomalyId, username);

        InspectionAnomaly anomaly = anomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new RuntimeException("Anomaly not found: " + anomalyId));

        if (anomaly.getSource() != AnomalySource.AI_GENERATED) {
            throw new RuntimeException("Can only accept AI-generated detections");
        }

        // Log the approval
        AnnotationAction action = createAction(
                anomalyId,
                anomaly.getInspectionId(),
                userId,
                username,
                ActionType.APPROVED,
                null,
                null,
                null,
                null,
                "AI detection accepted"
        );
        actionRepository.save(action);

        log.info("Accepted AI detection: {}", anomalyId);
    }

    /**
     * Reject AI detection (same as delete, but specifically for AI detections)
     */
    @Transactional
    public void rejectAiDetection(Long anomalyId, String reason, Integer userId, String username) {
        log.info("Rejecting AI detection: {} by user: {}", anomalyId, username);

        InspectionAnomaly anomaly = anomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new RuntimeException("Anomaly not found: " + anomalyId));

        if (anomaly.getSource() != AnomalySource.AI_GENERATED) {
            throw new RuntimeException("Can only reject AI-generated detections");
        }

        // Soft delete
        anomaly.setIsActive(false);
        anomalyRepository.save(anomaly);

        // Log the rejection
        AnnotationAction action = createAction(
                anomalyId,
                anomaly.getInspectionId(),
                userId,
                username,
                ActionType.REJECTED,
                toBBoxData(anomaly),
                null,
                toClassificationData(anomaly),
                null,
                reason != null ? reason : "AI detection rejected"
        );
        actionRepository.save(action);

        log.info("Rejected AI detection: {}", anomalyId);
    }

    /**
     * Get annotation history for an anomaly
     */
    public List<AnnotationAction> getAnnotationHistory(Long anomalyId) {
        return actionRepository.findByAnomalyIdOrderByActionTimestampDesc(anomalyId);
    }

    /**
     * Get all actions for an inspection
     */
    public List<AnnotationAction> getInspectionActions(Long inspectionId) {
        return actionRepository.findByInspectionIdOrderByActionTimestampDesc(inspectionId);
    }

    /**
     * Get all annotation actions across all inspections with metadata
     * This is used by regular users to view annotation history
     */
    public Map<String, Object> getAllAnnotationActionsWithMetadata() {
        log.info("Fetching all annotation actions with metadata");
        
        try {
            // Get all annotation actions ordered by timestamp (newest first)
            List<AnnotationAction> actions = actionRepository.findAll();
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
            
            log.info("Fetched {} annotation actions with metadata", enrichedActions.size());
            return result;
            
        } catch (Exception e) {
            log.error("Error fetching annotation actions with metadata", e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            errorResult.put("annotations", Collections.emptyList());
            errorResult.put("total", 0);
            return errorResult;
        }
    }

    // Helper methods

    private AnnotationAction createAction(Long anomalyId, Long inspectionId, Integer userId,
                                          String username, ActionType actionType,
                                          BBoxData previousBbox, BBoxData newBbox,
                                          ClassificationData previousClassification,
                                          ClassificationData newClassification,
                                          String comment) {
        AnnotationAction action = new AnnotationAction();
        action.setAnomalyId(anomalyId);
        action.setInspectionId(inspectionId);
        action.setUserId(userId);
        action.setUsername(username);
        action.setActionType(actionType);
        action.setPreviousBbox(previousBbox);
        action.setNewBbox(newBbox);
        action.setPreviousClassification(previousClassification);
        action.setNewClassification(newClassification);
        action.setComment(comment);
        return action;
    }

    private BBoxData toBBoxData(InspectionAnomaly anomaly) {
        if (anomaly.getBboxX() == null) {
            return null;
        }
        return new BBoxData(
                anomaly.getBboxX(),
                anomaly.getBboxY(),
                anomaly.getBboxWidth(),
                anomaly.getBboxHeight()
        );
    }

    private ClassificationData toClassificationData(InspectionAnomaly anomaly) {
        if (anomaly.getFaultType() == null) {
            return null;
        }
        return new ClassificationData(
                anomaly.getFaultType(),
                anomaly.getFaultConfidence(),
                anomaly.getClassId()
        );
    }
}
