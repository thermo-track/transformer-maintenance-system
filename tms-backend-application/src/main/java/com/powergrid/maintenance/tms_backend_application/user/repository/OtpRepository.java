package com.powergrid.maintenance.tms_backend_application.user.repository;

import com.powergrid.maintenance.tms_backend_application.user.model.Otp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpRepository extends JpaRepository<Otp, Long> {
    
    /**
     * Find OTP by email
     */
    Optional<Otp> findByEmail(String email);

    /**
     * Find OTP by email and code
     */
    Optional<Otp> findByEmailAndOtpCode(String email, String otpCode);

    /**
     * Delete all OTPs for an email
     */
    void deleteByEmail(String email);

    /**
     * Check if OTP exists for email
     */
    boolean existsByEmail(String email);
}
