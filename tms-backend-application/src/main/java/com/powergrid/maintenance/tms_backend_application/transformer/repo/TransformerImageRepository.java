package com.powergrid.maintenance.tms_backend_application.transformer.repo;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.TransformerImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransformerImageRepository extends JpaRepository<TransformerImage, String> {
    
    /**
     * Find image by transformer ID and weather condition
     */
    Optional<TransformerImage> findByTransformerIdAndWeatherCondition(
        String transformerId, 
        TransformerImage.WeatherCondition weatherCondition
    );
    
    /**
     * Find all images for a specific transformer
     */
    List<TransformerImage> findByTransformerId(String transformerId);
    
    /**
     * Find all images for a specific weather condition across all transformers
     */
    List<TransformerImage> findByWeatherCondition(TransformerImage.WeatherCondition weatherCondition);
    
    /**
     * Find the most recently uploaded image for a transformer
     */
    Optional<TransformerImage> findFirstByTransformerIdOrderByBaseImageUploadedAtDesc(String transformerId);
    
    /**
     * Check if any image exists for a transformer
     */
    boolean existsByTransformerId(String transformerId);
    
    /**
     * Count images for a specific transformer
     */
    long countByTransformerId(String transformerId);
    
    /**
     * Delete all images for a specific transformer
     */
    void deleteByTransformerId(String transformerId);
}