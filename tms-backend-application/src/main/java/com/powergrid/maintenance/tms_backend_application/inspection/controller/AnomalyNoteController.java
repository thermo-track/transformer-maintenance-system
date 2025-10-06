package com.powergrid.maintenance.tms_backend_application.inspection.controller;

import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnomalyNoteCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnomalyNoteResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.AnomalyNoteUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.service.AnomalyNoteService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/inspections")
@RequiredArgsConstructor
public class AnomalyNoteController {

    private final AnomalyNoteService anomalyNoteService;

    @Operation(summary = "Get all notes for an anomaly", description = "Retrieves all notes for a specific anomaly in an inspection")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notes retrieved successfully"),
        @ApiResponse(responseCode = "404", description = "Inspection or anomaly not found")
    })
    @GetMapping("/{inspectionId}/anomalies/{anomalyId}/notes")
    public ResponseEntity<Map<String, Object>> getAnomalyNotes(
            @Parameter(description = "Inspection ID") @PathVariable String inspectionId,
            @Parameter(description = "Anomaly ID") @PathVariable Long anomalyId) {
        
        try {
            log.info("Fetching notes for inspection: {} and anomaly: {}", inspectionId, anomalyId);
            
            List<AnomalyNoteResponseDTO> notes = anomalyNoteService.getNotesByInspectionAndAnomaly(inspectionId, anomalyId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("notes", notes);
            response.put("count", notes.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching notes for inspection: {} and anomaly: {}", inspectionId, anomalyId, e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to fetch notes");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @Operation(summary = "Create a new note for an anomaly", description = "Creates a new note for a specific anomaly in an inspection")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Note created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "404", description = "Inspection or anomaly not found")
    })
    @PostMapping("/{inspectionId}/anomalies/{anomalyId}/notes")
    public ResponseEntity<AnomalyNoteResponseDTO> createAnomalyNote(
            @Parameter(description = "Inspection ID") @PathVariable String inspectionId,
            @Parameter(description = "Anomaly ID") @PathVariable Long anomalyId,
            @Parameter(description = "Note details") @Valid @RequestBody AnomalyNoteCreateRequestDTO request) {
        
        try {
            log.info("Creating note for inspection: {} and anomaly: {}", inspectionId, anomalyId);
            
            AnomalyNoteResponseDTO createdNote = anomalyNoteService.createNote(inspectionId, anomalyId, request);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdNote);
            
        } catch (Exception e) {
            log.error("Error creating note for inspection: {} and anomaly: {}", inspectionId, anomalyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Update an existing note", description = "Updates an existing note for a specific anomaly in an inspection")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Note updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "404", description = "Note, inspection, or anomaly not found")
    })
    @PutMapping("/{inspectionId}/anomalies/{anomalyId}/notes/{noteId}")
    public ResponseEntity<AnomalyNoteResponseDTO> updateAnomalyNote(
            @Parameter(description = "Inspection ID") @PathVariable String inspectionId,
            @Parameter(description = "Anomaly ID") @PathVariable Long anomalyId,
            @Parameter(description = "Note ID") @PathVariable Long noteId,
            @Parameter(description = "Updated note details") @Valid @RequestBody AnomalyNoteUpdateRequestDTO request) {
        
        try {
            log.info("Updating note: {} for inspection: {} and anomaly: {}", noteId, inspectionId, anomalyId);
            
            AnomalyNoteResponseDTO updatedNote = anomalyNoteService.updateNote(inspectionId, anomalyId, noteId, request);
            
            return ResponseEntity.ok(updatedNote);
            
        } catch (Exception e) {
            log.error("Error updating note: {} for inspection: {} and anomaly: {}", noteId, inspectionId, anomalyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Operation(summary = "Delete a note", description = "Deletes a specific note for an anomaly in an inspection")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Note deleted successfully"),
        @ApiResponse(responseCode = "404", description = "Note, inspection, or anomaly not found")
    })
    @DeleteMapping("/{inspectionId}/anomalies/{anomalyId}/notes/{noteId}")
    public ResponseEntity<Map<String, String>> deleteAnomalyNote(
            @Parameter(description = "Inspection ID") @PathVariable String inspectionId,
            @Parameter(description = "Anomaly ID") @PathVariable Long anomalyId,
            @Parameter(description = "Note ID") @PathVariable Long noteId) {
        
        try {
            log.info("Deleting note: {} for inspection: {} and anomaly: {}", noteId, inspectionId, anomalyId);
            
            anomalyNoteService.deleteNote(inspectionId, anomalyId, noteId);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Note deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error deleting note: {} for inspection: {} and anomaly: {}", noteId, inspectionId, anomalyId, e);
            
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to delete note");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}