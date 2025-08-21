package com.powergrid.maintenance.tms_backend_application.inspection.repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.powergrid.maintenance.tms_backend_application.inspection.domain.Inspection;

@Repository
public interface InspectionRepo extends JpaRepository<Inspection, String> {

    List<Inspection> findByBranch(String branch);

    // by transformer business key
    List<Inspection> findByTransformerNo(String transformerNo);

    List<Inspection> findByDateOfInspectionBetween(LocalDate startDate, LocalDate endDate);

    @Query("SELECT i FROM Inspection i WHERE i.branch = :branch AND i.dateOfInspection BETWEEN :startDate AND :endDate")
    List<Inspection> findByBranchAndDateRange(@Param("branch") String branch,
                                              @Param("startDate") LocalDate startDate,
                                              @Param("endDate") LocalDate endDate);

    boolean existsByTransformerNoAndDateOfInspection(String transformerNo, LocalDate dateOfInspection);

    Optional<Inspection> findTopByTransformerNoOrderByDateOfInspectionDescTimeOfInspectionDesc(String transformerNo);
}
