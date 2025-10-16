package com.powergrid.maintenance.tms_backend_application.user.service;

import com.powergrid.maintenance.tms_backend_application.user.model.User;
import com.powergrid.maintenance.tms_backend_application.user.model.UserPrincipal;
import com.powergrid.maintenance.tms_backend_application.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Custom UserDetailsService implementation for Spring Security.
 * This service is used by Spring Security to load user-specific data during authentication.
 */
@Service
public class MyUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Loads the user by username from the database.
     * This method is called by Spring Security during authentication.
     *
     * @param username the username to search for
     * @return UserDetails object containing user information
     * @throws UsernameNotFoundException if user is not found
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        return new UserPrincipal(user);
    }
}
