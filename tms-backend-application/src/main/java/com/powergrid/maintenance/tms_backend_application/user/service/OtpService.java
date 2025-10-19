package com.powergrid.maintenance.tms_backend_application.user.service;

import com.powergrid.maintenance.tms_backend_application.user.model.Otp;
import com.powergrid.maintenance.tms_backend_application.user.repository.OtpRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service for generating and verifying OTPs
 */
@Service
public class OtpService {

    @Autowired
    private OtpRepository otpRepository;

    @Autowired
    private EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final SecureRandom random = new SecureRandom();

    /**
     * Generate a random 6-digit OTP based on OTP_LENGTH
     */
    private String generateOtpCode() {
        int min = (int) Math.pow(10, OTP_LENGTH - 1); // For 6 digits: 100000
        int max = (int) Math.pow(10, OTP_LENGTH) - 1;  // For 6 digits: 999999
        int otp = min + random.nextInt(max - min + 1);
        return String.valueOf(otp);
    }

    /**
     * Generate and send OTP to email
     */
    @Transactional
    public void generateAndSendOtp(String email) {
        // Delete any existing OTP for this email
        otpRepository.deleteByEmail(email);

        // Generate new OTP
        String otpCode = generateOtpCode();
        LocalDateTime now = LocalDateTime.now();

        Otp otp = new Otp();
        otp.setEmail(email);
        otp.setOtpCode(otpCode);
        otp.setCreatedAt(now);
        otp.setExpiresAt(now.plusMinutes(OTP_EXPIRY_MINUTES));
        otp.setVerified(false);

        otpRepository.save(otp);

        // Send OTP via email
        emailService.sendOtpEmail(email, otpCode);

        System.out.println("OTP generated for " + email + ": " + otpCode + " (for testing purposes)");
    }

    /**
     * Verify OTP for an email
     */
    @Transactional
    public boolean verifyOtp(String email, String otpCode) {
        Optional<Otp> otpOptional = otpRepository.findByEmailAndOtpCode(email, otpCode);

        if (otpOptional.isEmpty()) {
            return false;
        }

        Otp otp = otpOptional.get();

        if (!otp.isValid()) {
            return false;
        }

        // Mark OTP as verified
        otp.setVerified(true);
        otpRepository.save(otp);

        return true;
    }

    /**
     * Check if OTP exists and is valid for an email
     */
    public boolean hasValidOtp(String email) {
        Optional<Otp> otpOptional = otpRepository.findByEmail(email);
        return otpOptional.isPresent() && otpOptional.get().isValid();
    }

    /**
     * Resend OTP to email
     */
    @Transactional
    public void resendOtp(String email) {
        generateAndSendOtp(email);
    }

    /**
     * Delete OTP for an email
     */
    @Transactional
    public void deleteOtp(String email) {
        otpRepository.deleteByEmail(email);
    }
}
