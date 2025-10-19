package com.powergrid.maintenance.tms_backend_application.user.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service for sending emails
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    /**
     * Send OTP verification email
     */
    public void sendOtpEmail(String toEmail, String otpCode) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Email Verification - Transformer Maintenance System");
            message.setText(buildOtpEmailBody(otpCode));
            
            mailSender.send(message);
            System.out.println("OTP email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send OTP email: " + e.getMessage());
            throw new RuntimeException("Failed to send verification email. Please try again.");
        }
    }

    /**
     * Build OTP email body
     */
    private String buildOtpEmailBody(String otpCode) {
        return """
                Welcome to Transformer Maintenance System!
                
                Your verification code is: %s
                
                This code will expire in 10 minutes.
                
                If you did not request this code, please ignore this email.
                
                Best regards,
                Transformer Maintenance System Team
                """.formatted(otpCode);
    }

    /**
     * Send welcome email after successful verification
     */
    public void sendWelcomeEmail(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Welcome to Transformer Maintenance System");
            message.setText(buildWelcomeEmailBody(username));
            
            mailSender.send(message);
            System.out.println("Welcome email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send welcome email: " + e.getMessage());
            // Don't throw exception for welcome email failure
        }
    }

    /**
     * Build welcome email body
     */
    private String buildWelcomeEmailBody(String username) {
        return """
                Hello %s,
                
                Your email has been successfully verified!
                
                You can now login to the Transformer Maintenance System with your credentials.
                
                Best regards,
                Transformer Maintenance System Team
                """.formatted(username);
    }
}
