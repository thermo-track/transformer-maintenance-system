package com.powergrid.maintenance.tms_backend_application.user.repository;

import com.powergrid.maintenance.tms_backend_application.user.model.RoleChangeRequest;
import com.powergrid.maintenance.tms_backend_application.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoleChangeRequestRepository extends JpaRepository<RoleChangeRequest, Long> {
    
    List<RoleChangeRequest> findByStatus(String status);
    
    List<RoleChangeRequest> findByUserOrderByRequestedAtDesc(User user);
    
    Optional<RoleChangeRequest> findByUserAndStatus(User user, String status);
    
    List<RoleChangeRequest> findAllByOrderByRequestedAtDesc();
    
    void deleteByUser(User user);
    
    void deleteByReviewedBy(User reviewer);
}