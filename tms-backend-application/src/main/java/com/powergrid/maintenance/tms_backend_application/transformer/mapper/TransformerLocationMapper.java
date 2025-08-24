package com.powergrid.maintenance.tms_backend_application.transformer.mapper;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerLocationResponseDTO;

public class TransformerLocationMapper {
    
    public static TransformerLocationResponseDTO toTransformerLocationResponseDTO(Transformer transformer, boolean success, String message) {
        TransformerLocationResponseDTO dto = new TransformerLocationResponseDTO();
        
        dto.setId(transformer.getId());
        dto.setTransformerNo(transformer.getTransformerNo());
        dto.setLatitude(transformer.getLatitude());
        dto.setLongitude(transformer.getLongitude());
        dto.setAddress(transformer.getAddress());
        dto.setLocationSetAt(transformer.getLocationSetAt());
        dto.setSuccess(success);
        dto.setMessage(message);
        
        return dto;
    }
}