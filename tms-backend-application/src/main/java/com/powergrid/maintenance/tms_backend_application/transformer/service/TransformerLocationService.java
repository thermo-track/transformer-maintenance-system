package com.powergrid.maintenance.tms_backend_application.transformer.service;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import com.powergrid.maintenance.tms_backend_application.transformer.repo.TransformerRepository;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.UpdateLocationRequestDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerLocationResponseDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.dto.TransformerMapLocationDTO;
import com.powergrid.maintenance.tms_backend_application.transformer.mapper.TransformerLocationMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TransformerLocationService {
    
    @Autowired
    private TransformerRepository transformerRepository;
    
    @Transactional
    public TransformerLocationResponseDTO updateTransformerLocation(String transformerNo, UpdateLocationRequestDTO request) {
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            throw new RuntimeException("Transformer not found with transformer number: " + transformerNo);
        }
        
        Transformer transformer = optionalTransformer.get();
        
        validateLocationData(request.getLatitude(), request.getLongitude());
        
        try {
            transformer.setLocation(request.getLatitude(), request.getLongitude(), request.getAddress());
            Transformer updatedTransformer = transformerRepository.save(transformer);
            
            return TransformerLocationMapper.toTransformerLocationResponseDTO(updatedTransformer, true, "Location updated successfully");
            
        } catch (Exception e) {
            throw new RuntimeException("Error updating transformer location: " + e.getMessage(), e);
        }
    }
    
    @Transactional(readOnly = true)
    public TransformerLocationResponseDTO getTransformerLocation(String transformerNo) {
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            throw new RuntimeException("Transformer not found with transformer number: " + transformerNo);
        }
        
        Transformer transformer = optionalTransformer.get();
        return TransformerLocationMapper.toTransformerLocationResponseDTO(transformer, true, null);
    }
    
    @Transactional(readOnly = true)
    public boolean hasLocation(String transformerNo) {
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            return false;
        }
        
        Transformer transformer = optionalTransformer.get();
        return transformer.hasLocation();
    }
    
    @Transactional
    public boolean deleteTransformerLocation(String transformerNo) {
        Optional<Transformer> optionalTransformer = transformerRepository.findByTransformerNo(transformerNo);
        if (optionalTransformer.isEmpty()) {
            return false;
        }
        
        Transformer transformer = optionalTransformer.get();
        boolean hasLocation = transformer.hasLocation();
        
        if (hasLocation) {
            transformer.setLocation(null, null, null);
            transformerRepository.save(transformer);
            return true;
        }
        
        return false;
    }
    
    private void validateLocationData(BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Latitude and longitude are required");
        }
        
        // Validate coordinate ranges
        if (latitude.compareTo(BigDecimal.valueOf(-90)) < 0 || latitude.compareTo(BigDecimal.valueOf(90)) > 0) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        
        if (longitude.compareTo(BigDecimal.valueOf(-180)) < 0 || longitude.compareTo(BigDecimal.valueOf(180)) > 0) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
    }
    @Transactional(readOnly = true)
    public List<TransformerMapLocationDTO> getAllTransformersWithLocation() {
        try {
            List<Transformer> transformersWithLocation = transformerRepository.findAllTransformersWithLocation();
            return TransformerLocationMapper.toTransformerMapLocationDTOList(transformersWithLocation);
        } catch (Exception e) {
            throw new RuntimeException("Error retrieving transformers with location: " + e.getMessage(), e);
        }
    }
} 
