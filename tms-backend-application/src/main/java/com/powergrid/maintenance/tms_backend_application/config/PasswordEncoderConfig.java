package com.powergrid.maintenance.tms_backend_application.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Password encoder configuration.
 * Separated from SecurityConfig to avoid circular dependency issues.
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * BCrypt password encoder bean.
     * Uses 12 rounds (2^12 iterations) for password hashing.
     */
    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
