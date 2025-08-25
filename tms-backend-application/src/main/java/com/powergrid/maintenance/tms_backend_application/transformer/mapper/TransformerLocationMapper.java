package com.powergrid.maintenance.tms_backend_application.transformer.mapper;

import java.util.List;
import java.util.stream.Collectors;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerLocationResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerMapLocationDTO;

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
    
    public static TransformerMapLocationDTO toTransformerMapLocationDTO(Transformer transformer) {
        if (transformer == null) {
            return null;
        }
        
        return new TransformerMapLocationDTO(
                transformer.getTransformerNo(),
                transformer.getType(),
                transformer.getRegion(),
                transformer.getLatitude(),
                transformer.getLongitude(),
                transformer.getAddress(),
                transformer.getPoleNo(),
                transformer.getLocationDetails()
        );
    }
    
    public static List<TransformerMapLocationDTO> toTransformerMapLocationDTOList(List<Transformer> transformers) {
        if (transformers == null) {
            return null;
        }
        
        return transformers.stream()
                .map(TransformerLocationMapper::toTransformerMapLocationDTO)
                .collect(Collectors.toList());
    }
}