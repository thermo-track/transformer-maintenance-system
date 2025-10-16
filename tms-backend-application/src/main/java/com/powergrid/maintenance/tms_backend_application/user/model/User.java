package com.powergrid.maintenance.tms_backend_application.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * User Entity representing the users table in the database.
 * Used for authentication and authorization.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    /**
     * Role of the user (e.g., ROLE_USER, ROLE_ADMIN)
     * Default is ROLE_USER
     */
    @Column(nullable = false, length = 20)
    private String role = "ROLE_USER";

    /**
     * Account status flags
     */
    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private boolean accountNonExpired = true;

    @Column(nullable = false)
    private boolean accountNonLocked = true;

    @Column(nullable = false)
    private boolean credentialsNonExpired = true;
}
