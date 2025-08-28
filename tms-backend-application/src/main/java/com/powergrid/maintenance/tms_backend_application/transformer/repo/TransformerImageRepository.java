package com.powergrid.maintenance.tms_backend_application.transformer.repo;

import com.powergrid.maintenance.tms_backend_application.transformer.domain.TransformerImage;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransformerImageRepository extends JpaRepository<TransformerImage, String> {

    /**
     * Find image by transformer ID and weather condition
     * Using the relationship path transformer.id
     */
    Optional<TransformerImage> findByTransformer_IdAndWeatherCondition(
        String transformerId, 
        TransformerImage.WeatherCondition weatherCondition
    );

    /**
     * Find all images for a specific transformer using transformer ID
     */
    List<TransformerImage> findByTransformer_Id(String transformerId);

    /**
     * Find image by transformer entity and weather condition
     * Alternative method using the entity relationship
     */
    Optional<TransformerImage> findByTransformerAndWeatherCondition(
        Transformer transformer, 
        TransformerImage.WeatherCondition weatherCondition
    );

    /**
     * Find all images for a specific transformer using transformer entity
     */
    List<TransformerImage> findByTransformer(Transformer transformer);

    /**
     * Find all images for a specific weather condition across all transformers
     */
    List<TransformerImage> findByWeatherCondition(TransformerImage.WeatherCondition weatherCondition);

    /**
     * Find the most recently uploaded image for a transformer by ID
     */
    Optional<TransformerImage> findFirstByTransformer_IdOrderByBaseImageUploadedAtDesc(String transformerId);

    /**
     * Find the most recently uploaded image for a transformer entity
     */
    Optional<TransformerImage> findFirstByTransformerOrderByBaseImageUploadedAtDesc(Transformer transformer);

    /**
     * Check if any image exists for a transformer by ID
     */
    boolean existsByTransformer_Id(String transformerId);

    /**
     * Check if any image exists for a transformer entity
     */
    boolean existsByTransformer(Transformer transformer);

    /**
     * Count images for a specific transformer by ID
     */
    long countByTransformer_Id(String transformerId);

    /**
     * Count images for a specific transformer entity
     */
    long countByTransformer(Transformer transformer);

    /**
     * Delete all images for a specific transformer by ID
     * Note: This should generally not be needed due to cascade operations
     */
    void deleteByTransformer_Id(String transformerId);

    /**
     * Delete all images for a specific transformer entity
     * Note: This should generally not be needed due to cascade operations
     */
    void deleteByTransformer(Transformer transformer);

    /**
     * Custom query to find images by transformer ID with specific weather conditions
     * Useful for batch operations
     */
    @Query("SELECT ti FROM TransformerImage ti WHERE ti.transformer.id = :transformerId AND ti.weatherCondition IN :weatherConditions")
    List<TransformerImage> findByTransformerIdAndWeatherConditionIn(
        @Param("transformerId") String transformerId,
        @Param("weatherConditions") List<TransformerImage.WeatherCondition> weatherConditions
    );

    /**
     * Custom query to find transformers that have images for all specified weather conditions
     */
    @Query("SELECT DISTINCT ti.transformer FROM TransformerImage ti WHERE ti.weatherCondition IN :weatherConditions GROUP BY ti.transformer HAVING COUNT(DISTINCT ti.weatherCondition) = :conditionCount")
    List<Transformer> findTransformersWithAllWeatherConditions(
        @Param("weatherConditions") List<TransformerImage.WeatherCondition> weatherConditions,
        @Param("conditionCount") long conditionCount
    );

    /**
     * Find images uploaded by a specific user for a transformer
     */
    List<TransformerImage> findByTransformer_IdAndUploadedBy(String transformerId, String uploadedBy);

    /**
     * Find images by transformer and uploaded by specific user
     */
    List<TransformerImage> findByTransformerAndUploadedBy(Transformer transformer, String uploadedBy);
}