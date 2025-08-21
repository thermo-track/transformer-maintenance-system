package com.powergrid.maintenance.tms_backend_application.inspection.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.mapper.InspectionMapper;
import com.powergrid.maintenance.tms_backend_application.inspection.repo.InspectionRepo;

import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;

@Slf4j
@Transactional
@Service
public class InspectionService {

    @Autowired
    private InspectionRepo inspectionRepo;

    @Autowired
    private InspectionMapper inspectionMapper;

    // Optional but recommended: verify transformer exists by transformerNo
    @Autowired
    private TransformerRepository transformerRepo;

    public ResponseEntity<InspectionResponseDTO> createInspection(InspectionCreateRequestDTO requestDTO) {
        try {
            // Ensure transformer exists (business key)
            transformerRepo.findByTransformerNo(requestDTO.getTransformerNo())
                    .orElseThrow(() -> new RuntimeException("Transformer not found"));

            if (inspectionRepo.existsByTransformerNoAndDateOfInspection(
                    requestDTO.getTransformerNo(), requestDTO.getDateOfInspection())) {
                log.warn("Inspection already exists for transformer {} on date {}",
                        requestDTO.getTransformerNo(), requestDTO.getDateOfInspection());
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }

            Inspection inspection = inspectionMapper.toEntity(requestDTO);
            Inspection savedInspection = inspectionRepo.save(inspection);

            InspectionResponseDTO responseDTO = inspectionMapper.toResponseDTO(savedInspection);
            log.info("Successfully created inspection with ID: {}", savedInspection.getInspectionId());
            return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);

        } catch (Exception e) {
            log.error("Error creating inspection: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    public ResponseEntity<InspectionResponseDTO> updateInspection(String id, InspectionUpdateRequestDTO requestDTO) {
        try {
            Optional<Inspection> optionalInspection = inspectionRepo.findById(id);

            if (optionalInspection.isEmpty()) {
                log.warn("Inspection not found with id: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }

            // Ensure transformer exists
            transformerRepo.findByTransformerNo(requestDTO.getTransformerNo())
                    .orElseThrow(() -> new RuntimeException("Transformer not found"));

            Inspection existingInspection = optionalInspection.get();

            // Check duplicate if transformer or date changed
            if (!existingInspection.getTransformerNo().equals(requestDTO.getTransformerNo())
                    || !existingInspection.getDateOfInspection().equals(requestDTO.getDateOfInspection())) {

                if (inspectionRepo.existsByTransformerNoAndDateOfInspection(
                        requestDTO.getTransformerNo(), requestDTO.getDateOfInspection())) {
                    log.warn("Inspection already exists for transformer {} on date {}",
                            requestDTO.getTransformerNo(), requestDTO.getDateOfInspection());
                    return ResponseEntity.status(HttpStatus.CONFLICT).build();
                }
            }

            inspectionMapper.updateEntityFromDTO(existingInspection, requestDTO);
            Inspection updatedInspection = inspectionRepo.save(existingInspection);

            InspectionResponseDTO responseDTO = inspectionMapper.toResponseDTO(updatedInspection);
            log.info("Successfully updated inspection with ID: {}", id);
            return ResponseEntity.ok(responseDTO);

        } catch (Exception e) {
            log.error("Error updating inspection with id {}: ", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

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
    public ResponseEntity<List<InspectionResponseDTO>> getInspectionsByTransformerNo(String transformerNo) {
        try {
            List<Inspection> inspections = inspectionRepo.findByTransformerNo(transformerNo);
            if (inspections.isEmpty()) {
                return ResponseEntity.ok(new ArrayList<>());
            }
            List<InspectionResponseDTO> responseDTOs = inspectionMapper.toResponseDTOList(inspections);
            return ResponseEntity.ok(responseDTOs);

        } catch (Exception e) {
            log.error("Error retrieving inspections for transformer {}: ", transformerNo, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
