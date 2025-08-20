package com.powergrid.maintenance.tms_backend_application.repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.powergrid.maintenance.tms_backend_application.domain.Inspection;

@Repository
public interface InspectionRepo extends JpaRepository<Inspection, String> {
     /**
     * Find inspections by branch
     */
    List<Inspection> findByBranch(String branch);
    
    /**
     * Find inspections by transformer ID
     */
    List<Inspection> findByTransformerId(String transformerId);
    
    /**
     * Find inspections by date range
     */
    List<Inspection> findByDateOfInspectionBetween(LocalDate startDate, LocalDate endDate);
    
    /**
     * Find inspections by branch and date range
     */
    @Query("SELECT i FROM Inspection i WHERE i.branch = :branch AND i.dateOfInspection BETWEEN :startDate AND :endDate")
    List<Inspection> findByBranchAndDateRange(@Param("branch") String branch, 
                                             @Param("startDate") LocalDate startDate, 
                                             @Param("endDate") LocalDate endDate);
    
    /**
     * Check if inspection exists by transformer ID and date
     */
    boolean existsByTransformerIdAndDateOfInspection(String transformerId, LocalDate dateOfInspection);
    
    /**
     * Find latest inspection by transformer ID
     */
    @Query("SELECT i FROM Inspection i WHERE i.transformerId = :transformerId ORDER BY i.dateOfInspection DESC, i.timeOfInspection DESC LIMIT 1")
    Optional<Inspection> findLatestByTransformerId(@Param("transformerId") String transformerId);
}