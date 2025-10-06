package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;

@Repository
public interface InspectionRepo extends JpaRepository<Inspection, Long> {
    /**
     * Find inspections by branch
     */
    List<Inspection> findByBranch(String branch);
    
    /**
     * Find inspections by transformer No - UPDATED to use relationship
     */
    @Query("SELECT i FROM Inspection i WHERE i.transformer.transformerNo = :transformerNo")
    List<Inspection> findByTransformerNo(@Param("transformerNo") String transformerNo);
    
    /**
     * Find inspections by date range using timestamp
     */
    @Query("SELECT i FROM Inspection i WHERE DATE(i.inspectionTimestamp) BETWEEN :startDate AND :endDate")
    List<Inspection> findByInspectionTimestampDateBetween(@Param("startDate") LocalDate startDate, 
                                                         @Param("endDate") LocalDate endDate);
    
    /**
     * Find inspections by branch and date range using timestamp
     */
    @Query("SELECT i FROM Inspection i WHERE i.branch = :branch AND DATE(i.inspectionTimestamp) BETWEEN :startDate AND :endDate")
    List<Inspection> findByBranchAndDateRange(@Param("branch") String branch, 
                                             @Param("startDate") LocalDate startDate, 
                                             @Param("endDate") LocalDate endDate);
    
    /**
     * Check if inspection exists by transformer No and date (extracted from timestamp) - UPDATED
     */
    @Query("SELECT COUNT(i) > 0 FROM Inspection i WHERE i.transformer.transformerNo = :transformerNo AND DATE(i.inspectionTimestamp) = :inspectionDate")
    boolean existsByTransformerNoAndInspectionDate(@Param("transformerNo") String transformerNo, 
                                                  @Param("inspectionDate") LocalDate inspectionDate);
    
    /**
     * Find latest inspection by transformer No - UPDATED
     */
    @Query("SELECT i FROM Inspection i WHERE i.transformer.transformerNo = :transformerNo ORDER BY i.inspectionTimestamp DESC LIMIT 1")
    Optional<Inspection> findLatestByTransformerNo(@Param("transformerNo") String transformerNo);
    
    /**
     * Find inspections by transformer No and date range - UPDATED
     */
    @Query("SELECT i FROM Inspection i WHERE i.transformer.transformerNo = :transformerNo AND DATE(i.inspectionTimestamp) BETWEEN :startDate AND :endDate")
    List<Inspection> findByTransformerNoAndDateRange(@Param("transformerNo") String transformerNo,
                                                    @Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate);
    
    /**
     * Find inspections within specific timestamp range
     */
    @Query("SELECT i FROM Inspection i WHERE i.inspectionTimestamp BETWEEN :startTimestamp AND :endTimestamp")
    List<Inspection> findByInspectionTimestampBetween(@Param("startTimestamp") ZonedDateTime startTimestamp,
                                                     @Param("endTimestamp") ZonedDateTime endTimestamp);
    
    /**
     * Find inspections by transformer No within timestamp range - UPDATED
     */
    @Query("SELECT i FROM Inspection i WHERE i.transformer.transformerNo = :transformerNo AND i.inspectionTimestamp BETWEEN :startTimestamp AND :endTimestamp")
    List<Inspection> findByTransformerNoAndInspectionTimestampBetween(@Param("transformerNo") String transformerNo,
                                                                     @Param("startTimestamp") ZonedDateTime startTimestamp,
                                                                     @Param("endTimestamp") ZonedDateTime endTimestamp);

    /**
     * Find latest inspection per transformer - UPDATED to use relationship
     */
    @Query("SELECT i FROM Inspection i " +
           "WHERE i.inspectionTimestamp = (" +
           "    SELECT MAX(i2.inspectionTimestamp) " +
           "    FROM Inspection i2 " +
           "    WHERE i2.transformer.transformerNo = i.transformer.transformerNo" +
           ")")
    List<Inspection> findLatestInspectionPerTransformer();
}