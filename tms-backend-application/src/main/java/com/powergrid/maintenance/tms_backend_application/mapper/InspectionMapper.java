package com.powergrid.maintenance.tms_backend_application.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.powergrid.maintenance.tms_backend_application.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.dto.ImageUploadResponseDTO;
import com.powergrid.maintenance.tms_backend_application.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.dto.InspectionUpdateRequestDTO;

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
        inspection.setTransformerId(dto.getTransformerId());
        inspection.setDateOfInspection(dto.getDateOfInspection());
        inspection.setTimeOfInspection(dto.getTimeOfInspection());

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
        inspection.setTransformerId(dto.getTransformerId());
        inspection.setDateOfInspection(dto.getDateOfInspection());
        inspection.setTimeOfInspection(dto.getTimeOfInspection());
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
        dto.setTransformerId(inspection.getTransformerId());
        dto.setDateOfInspection(inspection.getDateOfInspection());
        dto.setTimeOfInspection(inspection.getTimeOfInspection());
        
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

    public ImageUploadResponseDTO toImageUploadResponseDTO(Inspection inspection) {
        if (inspection == null) {
            return null;
        }
        
        ImageUploadResponseDTO responseDTO = new ImageUploadResponseDTO();
        responseDTO.setInspectionId(inspection.getInspectionId());
        responseDTO.setImageName(inspection.getImageName());
        responseDTO.setImageType(inspection.getImageType());
        responseDTO.setEnvironmentalCondition(inspection.getEnvironmentalCondition()); // Add this line
        responseDTO.setImageSize(inspection.getImageData() != null ? inspection.getImageData().length : 0);
        responseDTO.setMessage("Image uploaded successfully");
        
        return responseDTO;
    }
    
}
