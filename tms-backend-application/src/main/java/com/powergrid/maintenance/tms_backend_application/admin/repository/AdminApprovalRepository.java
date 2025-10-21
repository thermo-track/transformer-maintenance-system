package com.powergrid.maintenance.tms_backend_application.admin.repository;

import com.powergrid.maintenance.tms_backend_application.admin.model.AdminApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AdminApprovalRepository extends JpaRepository<AdminApproval, Long> {
    
    Optional<AdminApproval> findByUserId(Integer userId);
    
    Optional<AdminApproval> findByEmail(String email);
    
    List<AdminApproval> findByStatus(AdminApproval.ApprovalStatus status);
    
    boolean existsByUserId(Integer userId);
    
    boolean existsByEmail(String email);
}
