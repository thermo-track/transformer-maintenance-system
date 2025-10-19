package com.powergrid.maintenance.tms_backend_application.config;

import com.powergrid.maintenance.tms_backend_application.user.service.MyUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Security configuration for Spring Security.
 * Configures authentication, authorization, and password encoding.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Enables @PreAuthorize and other method-level security annotations
public class SecurityConfig {

    private final MyUserDetailsService userDetailsService;
    private final BCryptPasswordEncoder passwordEncoder;

    /**
     * Constructor injection to avoid circular dependencies.
     */
    public SecurityConfig(MyUserDetailsService userDetailsService, BCryptPasswordEncoder passwordEncoder) {
        this.userDetailsService = userDetailsService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Configure security filter chain.
     * Defines which endpoints are public and which require authentication.
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                // Disable CSRF for REST API
                .csrf(AbstractHttpConfigurer::disable)
                
                // Enable CORS using our CorsConfig
                .cors(cors -> {})
                
                // Configure authorization rules - ORDER MATTERS!
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints - no authentication required
                        .requestMatchers("/api/auth/register", "/api/auth/login", "/api/auth/logout", 
                                        "/api/auth/verify-otp", "/api/auth/resend-otp").permitAll()
                        
                        // Swagger/OpenAPI endpoints
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        
                        // Profile endpoints require authentication (GET, PUT, DELETE)
                        .requestMatchers("/api/auth/profile", "/api/auth/account", "/api/auth/me").authenticated()
                        
                        // All other endpoints require authentication
                        .anyRequest().authenticated()
                )
                
                // Disable form login (we're using REST API)
                .formLogin(AbstractHttpConfigurer::disable)
                
                // Enable HTTP Basic authentication for protected endpoints
                .httpBasic(basic -> {})
                
                // Session management
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )
                
                // Use userDetailsService directly instead of deprecated AuthenticationProvider
                .userDetailsService(userDetailsService)
                
                .build();
    }

    /**
     * Configure authentication with UserDetailsService and PasswordEncoder.
     * This is the modern Spring Security 6.x approach without deprecated APIs.
     */
    @Autowired
    public void configureGlobal(AuthenticationManagerBuilder auth) throws Exception {
        auth.userDetailsService(userDetailsService)
            .passwordEncoder(passwordEncoder);
    }

    /**
     * Authentication manager bean.
     * Required for manual authentication in the login endpoint.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
