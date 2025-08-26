package com.powergrid.maintenance.tms_backend_application.inspection.mapper;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.CloudImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionStatusUpdateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionUpdateRequestDTO;

@Component
public class InspectionMapper {
    /**
     * Convert CreateRequestDTO to Entity
     */
    public Inspection toEntity(InspectionCreateRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        
        Inspection inspection = new Inspection();
        inspection.setBranch(dto.getBranch());
        inspection.setTransformerNo(dto.getTransformerNo());
        inspection.setInspectionTimestamp(dto.getInspectionTimestamp());
        inspection.setStatus(dto.getStatus());  

        return inspection;
    }
    
    /**
     * Update entity from UpdateRequestDTO
     */
    public void updateEntityFromDTO(Inspection inspection, InspectionUpdateRequestDTO dto) {
        if (dto == null || inspection == null) {
            return;
        }
        
        inspection.setBranch(dto.getBranch());
        inspection.setTransformerNo(dto.getTransformerNo());
        inspection.setInspectionTimestamp(dto.getInspectionTimestamp());
    }
    
    /**
     * Convert Entity to ResponseDTO
     */
    public InspectionResponseDTO toResponseDTO(Inspection inspection) {
        if (inspection == null) {
            return null;
        }
        
        InspectionResponseDTO dto = new InspectionResponseDTO();
        dto.setInspectionId(inspection.getInspectionId());
        dto.setBranch(inspection.getBranch());
        dto.setTransformerNo(inspection.getTransformerNo());
        dto.setInspectionTimestamp(inspection.getInspectionTimestamp());
        dto.setStatus(inspection.getStatus());


        if (inspection.getTransformer() != null) {
        dto.setPoleNo(inspection.getTransformer().getPoleNo());
        dto.setRegion(inspection.getTransformer().getRegion());
        dto.setType(inspection.getTransformer().getType());
        dto.setLocationDetails(inspection.getTransformer().getLocationDetails());
    }
        
        return dto;
    }
    
    /**
     * Convert List of Entities to List of ResponseDTOs
     */
    public List<InspectionResponseDTO> toResponseDTOList(List<Inspection> inspections) {
        if (inspections == null) {
            return null;
        }
        
        return inspections.stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    
    /**
     * Update entity status from StatusUpdateRequestDTO
     */
    public void updateStatusFromDTO(Inspection inspection, InspectionStatusUpdateRequestDTO dto) {
        if (dto == null || inspection == null) {
            return;
        }
        
        inspection.setStatus(dto.getStatus());
    }
    
    /**
     * Convert Entity to InspectionStatusResponseDTO (for status update responses)
     */
    public InspectionStatusResponseDTO toStatusResponseDTO(Inspection inspection) {
        if (inspection == null) {
            return null;
        }
        
        InspectionStatusResponseDTO dto = new InspectionStatusResponseDTO();
        dto.setInspectionId(inspection.getInspectionId());
        dto.setTransformerNo(inspection.getTransformerNo());
        dto.setStatus(inspection.getStatus());
        
        return dto;
    }

    /**
     * Update inspection entity with CloudImageUploadDTO data
     */
    public void updateInspectionWithDTO(Inspection inspection, CloudImageUploadDTO dto) {
        if (inspection == null) {
            return;
        }
        
        if (dto == null) {
            // Clear all cloud image fields
            inspection.setCloudImageUrl(null);
            inspection.setCloudinaryPublicId(null);
            inspection.setCloudImageName(null);
            inspection.setCloudImageType(null);
            inspection.setEnvironmentalCondition(null);
            inspection.setCloudUploadedAt(null); // Fixed: removed setImageUploadedAt
        } else {
            // Update with provided data
            inspection.setCloudImageUrl(dto.getCloudImageUrl());
            inspection.setCloudinaryPublicId(dto.getCloudinaryPublicId());
            inspection.setCloudImageName(dto.getCloudImageName());
            inspection.setCloudImageType(dto.getCloudImageType());
            inspection.setEnvironmentalCondition(dto.getEnvironmentalCondition());
            
            // Handle ZonedDateTime properly
            if (dto.getCloudUploadedAt() != null) {
                inspection.setCloudUploadedAt(dto.getCloudUploadedAt());
            } else {
                inspection.setCloudUploadedAt(ZonedDateTime.now());
            }
        }
    }

    /**
     * Convert Entity to CloudImageUploadResponseDTO
     */
    public CloudImageUploadResponseDTO toCloudImageUploadResponseDTO(Inspection inspection) {
        if (inspection == null) {
            return null;
        }
        
        CloudImageUploadResponseDTO dto = new CloudImageUploadResponseDTO();
        dto.setInspectionId(inspection.getInspectionId());
        dto.setCloudImageUrl(inspection.getCloudImageUrl());
        dto.setCloudinaryPublicId(inspection.getCloudinaryPublicId());
        dto.setCloudImageName(inspection.getCloudImageName());
        dto.setCloudImageType(inspection.getCloudImageType());
        dto.setEnvironmentalCondition(inspection.getEnvironmentalCondition());
        dto.setCloudUploadedAt(inspection.getCloudUploadedAt());
        
        return dto;
    }

}