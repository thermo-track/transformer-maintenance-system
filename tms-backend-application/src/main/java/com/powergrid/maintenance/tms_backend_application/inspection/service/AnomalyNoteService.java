package com.powergrid.maintenance.tms_backend_application.inspection.service;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.AnomalyNote;
import com.powergrid.maintenance.tms_backend_application.inspection.domain.InspectionAnomaly;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnomalyNoteCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnomalyNoteResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnomalyNoteUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.AnomalyNoteRepository;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionAnomalyRepository;
import com.powergrid.maintenance.tms_backend_application.common.exception.NotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AnomalyNoteService {

    private final AnomalyNoteRepository anomalyNoteRepository;
    private final InspectionAnomalyRepository inspectionAnomalyRepository;

    /**
     * Get all notes for a specific anomaly
     */
    @Transactional(readOnly = true)
    public List<AnomalyNoteResponseDTO> getNotesByInspectionAndAnomaly(String inspectionId, Long anomalyId) {
        log.info("Fetching notes for inspectionId: {} and anomalyId: {}", inspectionId, anomalyId);
        
        // Verify that the anomaly exists
        verifyAnomalyExists(inspectionId, anomalyId);
        
        Long inspectionIdLong = Long.parseLong(inspectionId);
        List<AnomalyNote> notes = anomalyNoteRepository.findByInspectionIdAndAnomalyIdOrderByCreatedAtDesc(inspectionIdLong, anomalyId);
        
        return notes.stream()
                .map(this::convertToResponseDTO)
                .collect(Collectors.toList());
    }

    /**
     * Create a new note for an anomaly
     */
    public AnomalyNoteResponseDTO createNote(String inspectionId, Long anomalyId, AnomalyNoteCreateRequestDTO requestDTO) {
        log.info("Creating note for inspectionId: {} and anomalyId: {}", inspectionId, anomalyId);
        
        // Verify that the anomaly exists
        verifyAnomalyExists(inspectionId, anomalyId);
        
        AnomalyNote note = new AnomalyNote();
        note.setAnomalyId(anomalyId);
        note.setNote(requestDTO.getNote());
        note.setCreatedBy(requestDTO.getCreatedBy());
        note.setCreatedAt(LocalDateTime.now());
        note.setUpdatedAt(LocalDateTime.now());
        
        AnomalyNote savedNote = anomalyNoteRepository.save(note);

        log.info("Created note with ID: {} for anomaly: {}", savedNote.getId(), anomalyId);
        return convertToResponseDTO(savedNote);
    }

    /**
     * Update an existing note
     */
    public AnomalyNoteResponseDTO updateNote(String inspectionId, Long anomalyId, Long noteId, AnomalyNoteUpdateRequestDTO requestDTO) {
        log.info("Updating note ID: {} for inspectionId: {} and anomalyId: {}", noteId, inspectionId, anomalyId);
        
        // Verify that the anomaly exists
        verifyAnomalyExists(inspectionId, anomalyId);
        
        AnomalyNote note = anomalyNoteRepository.findByIdAndInspectionIdAndAnomalyId(noteId, inspectionId, anomalyId)
                .orElseThrow(() -> new NotFoundException(
                    String.format("Note with ID %d not found for inspection %s and anomaly %s", noteId, inspectionId, anomalyId)
                ));
        
        note.setNote(requestDTO.getNote());
        note.setUpdatedAt(LocalDateTime.now());
        
        AnomalyNote savedNote = anomalyNoteRepository.save(note);
        
        log.info("Updated note with ID: {}", savedNote.getId());
        return convertToResponseDTO(savedNote);
    }

    /**
     * Delete a note
     */
    public void deleteNote(String inspectionId, Long anomalyId, Long noteId) {
        log.info("Deleting note ID: {} for inspectionId: {} and anomalyId: {}", noteId, inspectionId, anomalyId);
        
        // Verify that the anomaly exists
        verifyAnomalyExists(inspectionId, anomalyId);
        
        AnomalyNote note = anomalyNoteRepository.findByIdAndInspectionIdAndAnomalyId(noteId, inspectionId, anomalyId)
                .orElseThrow(() -> new NotFoundException(
                    String.format("Note with ID %d not found for inspection %s and anomaly %s", noteId, inspectionId, anomalyId)
                ));
        
        anomalyNoteRepository.delete(note);
        
        log.info("Deleted note with ID: {}", noteId);
    }

    /**
     * Verify that an anomaly exists for the given inspection
     */
    private void verifyAnomalyExists(String inspectionId, Long anomalyId) {
        InspectionAnomaly anomaly = inspectionAnomalyRepository.findById(anomalyId)
                .orElseThrow(() -> new NotFoundException(
                    String.format("Anomaly with ID %s not found", anomalyId)
                ));
        
        // Convert String inspectionId to Long for comparison
        // inspectionId comes as formatted string (e.g., "100000016")
        // anomaly.getInspectionId() returns Long from database
        Long inspectionIdLong;
        try {
            inspectionIdLong = Long.parseLong(inspectionId);
        } catch (NumberFormatException e) {
            throw new NotFoundException(
                String.format("Invalid inspection ID format: %s", inspectionId)
            );
        }
        
        if (!anomaly.getInspectionId().equals(inspectionIdLong)) {
            throw new NotFoundException(
                String.format("Anomaly with ID %s does not belong to inspection %s", anomalyId, inspectionId)
            );
        }
    }

    /**
     * Convert AnomalyNote entity to response DTO
     */
    private AnomalyNoteResponseDTO convertToResponseDTO(AnomalyNote note) {
        AnomalyNoteResponseDTO dto = new AnomalyNoteResponseDTO();
        dto.setId(note.getId());
        dto.setAnomalyId(note.getAnomalyId());
        dto.setNote(note.getNote());
        dto.setCreatedBy(note.getCreatedBy());
        dto.setCreatedAt(note.getCreatedAt());
        dto.setUpdatedAt(note.getUpdatedAt());
        return dto;
    }
}