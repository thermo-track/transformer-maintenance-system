package com.powergrid.maintenance.tms_backend_application.transformer.repo;

import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TransformerRepository extends JpaRepository<Transformer, String>, JpaSpecificationExecutor<Transformer> {

    Optional<Transformer> findByTransformerNo(String transformerNo);

    // All transformer numbers (distinct for safety)
    @Query("select distinct t.transformerNo from Transformer t order by t.transformerNo asc")
    List<String> findAllTransformerNos();

    // Transformer numbers filtered by region (branch)
    @Query("select distinct t.transformerNo from Transformer t where t.region = :region order by t.transformerNo asc")
    List<String> findTransformerNosByRegion(String region);
    
    @Query("SELECT t FROM Transformer t WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL")
    List<Transformer> findAllTransformersWithLocation();
}
