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

    /**
     * Send admin welcome email after approval
     */
    public void sendAdminWelcomeEmail(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Admin Access Granted - Transformer Maintenance System");
            message.setText(buildAdminWelcomeEmailBody(username));
            
            mailSender.send(message);
            System.out.println("Admin welcome email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send admin welcome email: " + e.getMessage());
            // Don't throw exception for welcome email failure
        }
    }

    /**
     * Build admin welcome email body
     */
    private String buildAdminWelcomeEmailBody(String username) {
        return """
                Hello %s,
                
                Congratulations! Your admin access request has been approved.
                
                You now have administrator privileges in the Transformer Maintenance System.
                
                With admin access, you can:
                - Manage user accounts
                - Trigger model retraining
                - Access advanced system features
                - View system analytics and reports
                
                Please use your admin privileges responsibly.
                
                Best regards,
                Transformer Maintenance System Team
                """.formatted(username);
    }

    /**
     * Send notification to existing admins about new admin request
     */
    public void sendAdminRequestNotification(String adminEmail, String candidateUsername, String candidateEmail, String justification) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(adminEmail);
            message.setSubject("New Admin Access Request - Action Required");
            message.setText(buildAdminRequestNotificationBody(candidateUsername, candidateEmail, justification));
            
            mailSender.send(message);
            System.out.println("Admin request notification sent successfully to: " + adminEmail);
        } catch (Exception e) {
            System.err.println("Failed to send admin request notification: " + e.getMessage());
            // Don't throw exception for notification failure
        }
    }

    /**
     * Build admin request notification email body
     */
    private String buildAdminRequestNotificationBody(String candidateUsername, String candidateEmail, String justification) {
        return """
                Admin Notification: New Admin Access Request
                
                A new user has requested admin access to the Transformer Maintenance System.
                
                Candidate Details:
                - Username: %s
                - Email: %s
                - Justification: %s
                
                Please review this request and take appropriate action:
                1. Login to the admin panel
                2. Navigate to Admin Approvals
                3. Review the candidate's information
                4. Approve or reject the request
                
                Best regards,
                Transformer Maintenance System
                """.formatted(candidateUsername, candidateEmail, justification);
    }

    /**
     * Send email to user informing them they're pending approval
     */
    public void sendPendingApprovalEmail(String toEmail, String username) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Admin Access Request Pending - Transformer Maintenance System");
            message.setText(buildPendingApprovalEmailBody(username));
            
            mailSender.send(message);
            System.out.println("Pending approval email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send pending approval email: " + e.getMessage());
            // Don't throw exception for notification email failure
        }
    }

    /**
     * Build pending approval email body
     */
    private String buildPendingApprovalEmailBody(String username) {
        return """
                Hello %s,
                
                Thank you for requesting admin access to the Transformer Maintenance System.
                
                Your request has been successfully submitted and is currently pending approval.
                
                What happens next:
                1. Your request will be reviewed by an existing administrator
                2. You will receive an email notification once a decision is made
                3. If approved, you will be granted admin privileges
                
                Status: Pending Review
                
                You can login to the system with regular user privileges while waiting for approval.
                
                Thank you for your patience.
                
                Best regards,
                Transformer Maintenance System Team
                """.formatted(username);
    }

    /**
     * Send rejection email to user
     */
    public void sendAdminRejectionEmail(String toEmail, String username, String rejectionReason) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Admin Access Request - Decision");
            message.setText(buildAdminRejectionEmailBody(username, rejectionReason));
            
            mailSender.send(message);
            System.out.println("Admin rejection email sent successfully to: " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send admin rejection email: " + e.getMessage());
            // Don't throw exception for rejection email failure
        }
    }

    /**
     * Build admin rejection email body
     */
    private String buildAdminRejectionEmailBody(String username, String rejectionReason) {
        return """
                Hello %s,
                
                We have reviewed your admin access request for the Transformer Maintenance System.
                
                Unfortunately, your request has not been approved at this time.
                
                Reason: %s
                
                You can continue to use the system with your regular user account.
                
                If you have questions about this decision, please contact your system administrator.
                
                Best regards,
                Transformer Maintenance System Team
                """.formatted(username, rejectionReason);
    }
}
