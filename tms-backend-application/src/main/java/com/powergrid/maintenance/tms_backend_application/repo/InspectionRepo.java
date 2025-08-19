package com.powergrid.maintenance.tms_backend_application.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.powergrid.maintenance.tms_backend_application.domain.Inspection;

@Repository
public interface InspectionRepo extends JpaRepository<Inspection, Integer> {

}