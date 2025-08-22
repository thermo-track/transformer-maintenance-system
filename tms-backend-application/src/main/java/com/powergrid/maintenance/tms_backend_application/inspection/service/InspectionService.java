package com.powergrid.maintenance.tms_backend_application.inspection.service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.enums.EnvironmentalCondition;
import com.powergrid.maintenance.tms_backend_application.inspection.mapper.InspectionMapper;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.extern.slf4j.Slf4j;


@Slf4j
@Transactional
@Service
public class InspectionService {

    @Autowired
    InspectionRepo inspectionRepo;

    @Autowired
    private InspectionMapper inspectionMapper;

        // Allowed image types
    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
        "image/jpeg", "image/jpg", "image/png", "image/gif", "image/bmp"
    );

    // Max file size (10MB)
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024;

    /**
     * Create a new inspection
     */
    public ResponseEntity<InspectionResponseDTO> createInspection(InspectionCreateRequestDTO requestDTO) {
        try {
            // Check for duplicate inspection (same transformer and date)
            if (inspectionRepo.existsByTransformerIdAndDateOfInspection(
                    requestDTO.getTransformerId(), requestDTO.getDateOfInspection())) {
                log.warn("Inspection already exists for transformer {} on date {}", 
                        requestDTO.getTransformerId(), requestDTO.getDateOfInspection());
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            
            // Convert DTO to entity
            Inspection inspection = inspectionMapper.toEntity(requestDTO);
            
            // Save entity
            Inspection savedInspection = inspectionRepo.save(inspection);
            
            // Convert back to response DTO
            InspectionResponseDTO responseDTO = inspectionMapper.toResponseDTO(savedInspection);
            
            log.info("Successfully created inspection with ID: {}", savedInspection.getInspectionId());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
            
        } catch (Exception e) {
            log.error("Error creating inspection: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Update an existing inspection
     */
    public ResponseEntity<InspectionResponseDTO> updateInspection(String id, InspectionUpdateRequestDTO requestDTO) {
        try {
            Optional<Inspection> optionalInspection = inspectionRepo.findById(id);
            
            if (optionalInspection.isEmpty()) {
                log.warn("Inspection not found with id: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            Inspection existingInspection = optionalInspection.get();
            
            // Check for duplicate if transformer ID or date changed
            if (!existingInspection.getTransformerId().equals(requestDTO.getTransformerId()) ||
                !existingInspection.getDateOfInspection().equals(requestDTO.getDateOfInspection())) {
                
                if (inspectionRepo.existsByTransformerIdAndDateOfInspection(
                        requestDTO.getTransformerId(), requestDTO.getDateOfInspection())) {
                    log.warn("Inspection already exists for transformer {} on date {}", 
                            requestDTO.getTransformerId(), requestDTO.getDateOfInspection());
                    return ResponseEntity.status(HttpStatus.CONFLICT).build();
                }
            }
            
            // Update entity from DTO
            inspectionMapper.updateEntityFromDTO(existingInspection, requestDTO);
            
            // Save updated entity
            Inspection updatedInspection = inspectionRepo.save(existingInspection);
            
            // Convert to response DTO
            InspectionResponseDTO responseDTO = inspectionMapper.toResponseDTO(updatedInspection);
            
            log.info("Successfully updated inspection with ID: {}", id);
            return ResponseEntity.ok(responseDTO);
            
        } catch (Exception e) {
            log.error("Error updating inspection with id {}: ", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

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
            List<Inspection> inspections = inspectionRepo.findByDateOfInspectionBetween(startDate, endDate);
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
            
            // Using the repository method to find inspections by transformer ID
            List<Inspection> inspections = inspectionRepo.findByTransformerId(transformerId);
            
            // Check if any inspections were found
            if (inspections.isEmpty()) {
                log.info("No inspections found for transformer ID: {}", transformerId);
                return ResponseEntity.ok(new ArrayList<>());
            }
            
            // Map entities to DTOs
            List<InspectionResponseDTO> responseDTOs = inspectionMapper.toResponseDTOList(inspections);
            
            log.info("Found {} inspections for transformer ID: {}", inspections.size(), transformerId);
            return ResponseEntity.ok(responseDTOs);
            
        } catch (Exception e) {
            log.error("Error retrieving inspections for transformer ID {}: ", transformerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Image related methods
    public ImageUploadResponseDTO uploadImage(String inspectionId, MultipartFile file, ImageUploadDTO imageUploadDTO) throws IOException {
        // Validate file
        validateImageFile(file);
        
        // Validate environmental condition
        EnvironmentalCondition.fromString(imageUploadDTO.getEnvironmentalCondition());
        
        Optional<Inspection> optionalInspection = inspectionRepo.findById(inspectionId);
        if (optionalInspection.isEmpty()) {
            throw new RuntimeException("Inspection not found with ID: " + inspectionId);
        }
        
        Inspection inspection = optionalInspection.get();
        
        // Set image data
        inspection.setImageData(file.getBytes());
        inspection.setImageName(file.getOriginalFilename());
        inspection.setImageType(file.getContentType());
        inspection.setEnvironmentalCondition(imageUploadDTO.getEnvironmentalCondition().toUpperCase());
        
        Inspection updatedInspection = inspectionRepo.save(inspection);
        return inspectionMapper.toImageUploadResponseDTO(updatedInspection);
    }


    private void validateImageFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Please select a file to upload");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size should not exceed 5MB");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new RuntimeException("Only image files (JPEG, PNG, GIF, BMP) are allowed");
        }
    }
        public byte[] getImage(String inspectionId) {
        return inspectionRepo.findById(inspectionId)
                .map(Inspection::getImageData)
                .orElse(null);
    }
    
    public String getImageType(String inspectionId) {
        return inspectionRepo.findById(inspectionId)
                .map(Inspection::getImageType)
                .orElse(null);
    }
    
    public boolean deleteImage(String inspectionId) {
        Optional<Inspection> optionalInspection = inspectionRepo.findById(inspectionId);
        if (optionalInspection.isPresent()) {
            Inspection inspection = optionalInspection.get();
            inspection.setImageData(null);
            inspection.setImageName(null);
            inspection.setImageType(null);
            inspection.setEnvironmentalCondition(null);
            inspectionRepo.save(inspection);
            return true;
        }
        return false;
    }
}

