package com.powergrid.maintenance.tms_backend_application.inspection.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionCreateRequestDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionResponseDTO;
import com.powergrid.maintenance.tms_backend_application.inspection.dto.InspectionUpdateRequestDTO;

@Component
public class InspectionMapper {

    public Inspection toEntity(InspectionCreateRequestDTO dto) {
        if (dto == null) return null;
        Inspection inspection = new Inspection();
        inspection.setBranch(dto.getBranch());
        inspection.setTransformerNo(dto.getTransformerNo());
        inspection.setDateOfInspection(dto.getDateOfInspection());
        inspection.setTimeOfInspection(dto.getTimeOfInspection());
        return inspection;
    }

    public void updateEntityFromDTO(Inspection inspection, InspectionUpdateRequestDTO dto) {
        if (dto == null || inspection == null) return;
        inspection.setBranch(dto.getBranch());
        inspection.setTransformerNo(dto.getTransformerNo());
        inspection.setDateOfInspection(dto.getDateOfInspection());
        inspection.setTimeOfInspection(dto.getTimeOfInspection());
    }

    public InspectionResponseDTO toResponseDTO(Inspection inspection) {
        if (inspection == null) return null;
        InspectionResponseDTO dto = new InspectionResponseDTO();
        dto.setInspectionId(inspection.getInspectionId());
        dto.setBranch(inspection.getBranch());
        dto.setTransformerNo(inspection.getTransformerNo());
        dto.setDateOfInspection(inspection.getDateOfInspection());
        dto.setTimeOfInspection(inspection.getTimeOfInspection());
        return dto;
    }

    public List<InspectionResponseDTO> toResponseDTOList(List<Inspection> inspections) {
        if (inspections == null) return null;
        return inspections.stream().map(this::toResponseDTO).collect(Collectors.toList());
    }
}
