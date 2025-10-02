package com.powergrid.maintenance.tms_backend_application.inspection.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.enums.InspectionStatus;
import com.powergrid.maintenance.tms_backend_application.inspection.mapper.InspectionMapper;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;

import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Transactional
@Service
public class InspectionService {

    @Autowired
    private InspectionRepo inspectionRepo;

    @Autowired
    private InspectionMapper inspectionMapper;

    @Autowired
    private TransformerRepository transformerRepo;

    /**
     * Create a new inspection with proper transformer relationship management
     */
    public ResponseEntity<InspectionResponseDTO> createInspection(InspectionCreateRequestDTO requestDTO) {
        try {
            // Step 1: Fetch the managed transformer entity from database
            Transformer transformer = transformerRepo.findByTransformerNo(requestDTO.getTransformerNo())
                    .orElseThrow(() -> new RuntimeException("Transformer not found: " + requestDTO.getTransformerNo()));
            
            log.info("Found transformer: {} with ID: {}", transformer.getTransformerNo(), transformer.getId());
            
            // Step 2: Convert DTO to entity (but don't set transformer yet)
            Inspection inspection = inspectionMapper.toEntity(requestDTO);
            
            // Step 3: Set the managed transformer entity (this is the key fix)
            inspection.setTransformer(transformer);
            
            // Step 4: Save entity (now with proper managed relationship)
            Inspection savedInspection = inspectionRepo.save(inspection);
            
            // Step 5: Convert back to response DTO
            InspectionResponseDTO responseDTO = inspectionMapper.toResponseDTO(savedInspection);
            
            log.info("Successfully created inspection with ID: {} for transformer: {}", 
                    savedInspection.getInspectionId(), transformer.getTransformerNo());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
            
        } catch (RuntimeException e) {
            log.error("Business logic error creating inspection: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Unexpected error creating inspection: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update an existing inspection with proper transformer relationship management
     */
    public ResponseEntity<InspectionResponseDTO> updateInspection(String id, InspectionUpdateRequestDTO requestDTO) {
        try {
            Optional<Inspection> optionalInspection = inspectionRepo.findById(id);
            
            if (optionalInspection.isEmpty()) {
                log.warn("Inspection not found with id: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // Fetch the managed transformer entity
            Transformer transformer = transformerRepo.findByTransformerNo(requestDTO.getTransformerNo())
                    .orElseThrow(() -> new RuntimeException("Transformer not found: " + requestDTO.getTransformerNo()));
            
            Inspection existingInspection = optionalInspection.get();
            
            // Update entity from DTO
            inspectionMapper.updateEntityFromDTO(existingInspection, requestDTO);
            
            // Set the managed transformer entity
            existingInspection.setTransformer(transformer);
            
            // Save updated entity
            Inspection updatedInspection = inspectionRepo.save(existingInspection);
            
            // Convert to response DTO
            InspectionResponseDTO responseDTO = inspectionMapper.toResponseDTO(updatedInspection);
            
            log.info("Successfully updated inspection with ID: {}", id);
            return ResponseEntity.ok(responseDTO);
            
        } catch (RuntimeException e) {
            log.error("Business logic error updating inspection {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            log.error("Unexpected error updating inspection with id {}: ", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Rest of your methods remain the same...
    
    /**
     * Delete an inspection
     */
    public ResponseEntity<Void> deleteInspection(String id) {
        try {
            if (!inspectionRepo.existsById(id)) {
                log.warn("Inspection not found with id: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            inspectionRepo.deleteById(id);
            log.info("Successfully deleted inspection with ID: {}", id);
            return ResponseEntity.noContent().build();
            
        } catch (Exception e) {
            log.error("Error deleting inspection with id {}: ", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get inspection by ID
     */
    @Transactional(readOnly = true)
    public ResponseEntity<InspectionResponseDTO> getInspectionById(String id) {
        try {
            Optional<Inspection> optionalInspection = inspectionRepo.findById(id);
            
            if (optionalInspection.isEmpty()) {
                log.warn("Inspection not found with id: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            InspectionResponseDTO responseDTO = inspectionMapper.toResponseDTO(optionalInspection.get());
            return ResponseEntity.ok(responseDTO);
            
        } catch (Exception e) {
            log.error("Error retrieving inspection with id {}: ", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get all inspections
     */
    @Transactional(readOnly = true)
    public ResponseEntity<List<InspectionResponseDTO>> getAllInspections() {
        try {
            List<Inspection> inspections = inspectionRepo.findAll();
            List<InspectionResponseDTO> responseDTOs = inspectionMapper.toResponseDTOList(inspections);
            
            return ResponseEntity.ok(responseDTOs);
            
        } catch (Exception e) {
            log.error("Error retrieving all inspections: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get inspections by branch
     */
    @Transactional(readOnly = true)
    public ResponseEntity<List<InspectionResponseDTO>> getInspectionsByBranch(String branch) {
        try {
            List<Inspection> inspections = inspectionRepo.findByBranch(branch);
            List<InspectionResponseDTO> responseDTOs = inspectionMapper.toResponseDTOList(inspections);
            
            return ResponseEntity.ok(responseDTOs);
            
        } catch (Exception e) {
            log.error("Error retrieving inspections for branch {}: ", branch, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get inspections by date range
     */
    @Transactional(readOnly = true)
    public ResponseEntity<List<InspectionResponseDTO>> getInspectionsByDateRange(LocalDate startDate, LocalDate endDate) {
        try {
            List<Inspection> inspections = inspectionRepo.findByInspectionTimestampDateBetween(startDate, endDate);
            List<InspectionResponseDTO> responseDTOs = inspectionMapper.toResponseDTOList(inspections);
            
            return ResponseEntity.ok(responseDTOs);
            
        } catch (Exception e) {
            log.error("Error retrieving inspections for date range {} to {}: ", startDate, endDate, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Transactional(readOnly = true)
    public ResponseEntity<List<InspectionResponseDTO>> getInspectionsByTransformerId(String transformerId) {
        try {
            log.info("Retrieving inspections for transformer ID: {}", transformerId);
            
            List<Inspection> inspections = inspectionRepo.findByTransformerNo(transformerId);
            
            if (inspections.isEmpty()) {
                log.info("No inspections found for transformer ID: {}", transformerId);
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            List<InspectionResponseDTO> responseDTOs = inspectionMapper.toResponseDTOList(inspections);
            
            log.info("Found {} inspections for transformer ID: {}", inspections.size(), transformerId);
            return ResponseEntity.ok(responseDTOs);
            
        } catch (Exception e) {
            log.error("Error retrieving inspections for transformer ID {}: ", transformerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public String getWeatherCondition(String inspectionId) {
        try {
            Optional<Inspection> inspection = inspectionRepo.findById(inspectionId);
            
            if (inspection.isPresent()) {
                return inspection.get().getEnvironmentalCondition();
            }

            log.warn("No inspection found with ID: " + inspectionId);
            return null;
        } catch (Exception e) {
            log.error("Error fetching weather condition for inspection: " + inspectionId, e);
            throw new RuntimeException("Failed to fetch weather condition", e);
        }
    }

    public ResponseEntity<List<InspectionResponseDTO>> getLatestInspectionPerTransformer() {
        try {
            List<Inspection> latestInspections = inspectionRepo.findLatestInspectionPerTransformer();
            
            List<InspectionResponseDTO> responseDTOs = latestInspections.stream()
                    .map(inspectionMapper::toResponseDTO)
                    .sorted((a, b) -> b.getInspectionTimestamp().compareTo(a.getInspectionTimestamp()))
                    .collect(Collectors.toList());
            
            log.info("Retrieved {} latest inspections for transformers", responseDTOs.size());
            return ResponseEntity.ok(responseDTOs);
            
        } catch (Exception e) {
            log.error("Error retrieving latest inspections per transformer", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @Transactional
    public ResponseEntity<InspectionStatusResponseDTO> updateInspectionStatus(String id, InspectionStatusUpdateRequestDTO requestDTO) {
        log.info("Updating inspection status for ID: {} to status: {}", id, requestDTO.getStatus());
        try {
            InspectionStatus newStatus;
            try {
                newStatus = InspectionStatus.fromValue(requestDTO.getStatus());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid inspection status provided: {}", requestDTO.getStatus());
                return ResponseEntity.badRequest().build();
            }
            
            Optional<Inspection> optionalInspection = inspectionRepo.findById(id);
            
            if (optionalInspection.isEmpty()) {
                log.warn("Inspection not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            Inspection inspection = optionalInspection.get();
            inspectionMapper.updateStatusFromDTO(inspection, requestDTO);
            Inspection updatedInspection = inspectionRepo.save(inspection);
            InspectionStatusResponseDTO responseDTO = inspectionMapper.toStatusResponseDTO(updatedInspection);
            
            log.info("Successfully updated inspection status for ID: {} to: {}", id, newStatus.getValue());
            return ResponseEntity.ok(responseDTO);
            
        } catch (Exception e) {
            log.error("Error updating inspection status for ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Save image metadata after Cloudinary upload
     */
    public CloudImageUploadResponseDTO saveImageMetadata(String inspectionId, CloudImageUploadDTO dto) {
        Optional<Inspection> optionalInspection = inspectionRepo.findById(inspectionId);
        if (optionalInspection.isEmpty()) {
            throw new RuntimeException("Inspection not found with ID: " + inspectionId);
        }

        Inspection inspection = optionalInspection.get();
        inspectionMapper.updateInspectionWithDTO(inspection, dto);
        Inspection updatedInspection = inspectionRepo.save(inspection);
        return inspectionMapper.toCloudImageUploadResponseDTO(updatedInspection);
    }

    /**
     * Delete image metadata
     */
    public boolean deleteImageMetadata(String inspectionId) {
        Optional<Inspection> optionalInspection = inspectionRepo.findById(inspectionId);
        if (optionalInspection.isPresent()) {
            Inspection inspection = optionalInspection.get();
            CloudImageUploadDTO empty = new CloudImageUploadDTO();
            inspectionMapper.updateInspectionWithDTO(inspection, empty);
            inspectionRepo.save(inspection);
            return true;
        }
        return false;
    }

    /**
     * Check if inspection has cloud image specifically
     */
    public boolean hasCloudImage(String inspectionId) {
        return inspectionRepo.findById(inspectionId)
                .map(Inspection::hasCloudImage)
                .orElse(false);
    }

    /**
     * Get cloud image URL for inspection
     */
    public String getCloudImageUrl(String inspectionId) {
        return inspectionRepo.findById(inspectionId)
                .map(Inspection::getCloudImageUrl)
                .orElse(null);
    }
}