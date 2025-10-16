package com.powergrid.maintenance.tms_backend_application.user.service;

import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.powergrid.maintenance.tms_backend_application.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Service class for user management operations like registration.
 */
@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    /**
     * Register a new user with encrypted password.
     *
     * @param user the user to register (with plain text password)
     * @return the saved user with encrypted password
     * @throws IllegalArgumentException if username already exists
     */
    public User registerUser(User user) {
        // Check if username already exists
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + user.getUsername());
        }

        // Encode the password before saving
        String rawPassword = user.getPassword();
        String encodedPassword = passwordEncoder.encode(rawPassword);
        user.setPassword(encodedPassword);

        // Set default values if not provided
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("ROLE_USER");
        }

        // Save user to database
        User savedUser = userRepository.save(user);
        log.info("User registered successfully: {}", savedUser.getUsername());

        return savedUser;
    }

    /**
     * Get a user by username.
     *
     * @param username the username to search for
     * @return the user if found, null otherwise
     */
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    /**
     * Check if a username exists.
     *
     * @param username the username to check
     * @return true if exists, false otherwise
     */
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
}
