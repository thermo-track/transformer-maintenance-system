package com.powergrid.maintenance.tms_backend_application.inspection.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
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
     * Convert Entity to ImageUploadResponseDTO
     */
    public ImageUploadResponseDTO toImageUploadResponseDTO(Inspection inspection) {
        if (inspection == null) {
            return null;
        }
        
        ImageUploadResponseDTO responseDTO = new ImageUploadResponseDTO();
        responseDTO.setInspectionId(inspection.getInspectionId());
        responseDTO.setImageName(inspection.getImageName());
        responseDTO.setImageType(inspection.getImageType());
        responseDTO.setEnvironmentalCondition(inspection.getEnvironmentalCondition());
        responseDTO.setImageSize(inspection.getImageData() != null ? inspection.getImageData().length : 0);
        responseDTO.setMessage("Image uploaded successfully");
        
        return responseDTO;
    }
}