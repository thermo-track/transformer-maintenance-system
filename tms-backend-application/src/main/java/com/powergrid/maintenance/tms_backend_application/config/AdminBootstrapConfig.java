package com.powergrid.maintenance.tms_backend_application.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Slf4j
@Configuration
public class AdminBootstrapConfig {

    @Value("${ADMIN_USERNAME:}")
    private String adminUsername;

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD_HASH:}")
    private String adminPasswordHash;

    @Value("${ADMIN_FULL_NAME:}")
    private String adminFullName;

    @Value("${ADMIN_EMPLOYEE_ID:}")
    private String adminEmployeeId;

    @Value("${ADMIN_DEPARTMENT:}")
    private String adminDepartment;

    @Bean
    public CommandLineRunner bootstrapAdmin(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                // Check if environment variables are set
                if (adminUsername == null || adminUsername.isEmpty() || 
                    adminEmail == null || adminEmail.isEmpty() || 
                    adminPasswordHash == null || adminPasswordHash.isEmpty()) {
                    log.warn("Admin credentials not provided in environment variables. Skipping admin bootstrap.");
                    return;
                }

                // Check if admin already exists
                Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE username = ?", 
                    Integer.class, 
                    adminUsername
                );

                if (count != null && count > 0) {
                    log.info("Admin user '{}' already exists. Skipping bootstrap.", adminUsername);
                    return;
                }

                // Insert admin user
                String sql = """
                    INSERT INTO users (
                        username, email, password, role, enabled, email_verified,
                        full_name, employee_id, department,
                        account_non_expired, account_non_locked, credentials_non_expired,
                        created_at
                    ) VALUES (?, ?, ?, 'ROLE_ADMIN', true, true, ?, ?, ?, true, true, true, CURRENT_TIMESTAMP)
                    """;

                jdbcTemplate.update(sql, 
                    adminUsername, 
                    adminEmail, 
                    adminPasswordHash, 
                    adminFullName, 
                    adminEmployeeId, 
                    adminDepartment
                );

                log.info("✅ Admin user '{}' successfully created!", adminUsername);
                log.info("   Email: {}", adminEmail);
                log.info("   Full Name: {}", adminFullName);
                log.info("   Department: {}", adminDepartment);

            } catch (Exception e) {
                log.error("❌ Failed to bootstrap admin user: {}", e.getMessage(), e);
            }
        };
    }
}
