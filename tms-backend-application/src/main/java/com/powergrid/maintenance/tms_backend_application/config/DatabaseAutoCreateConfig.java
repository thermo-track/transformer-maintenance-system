package com.powergrid.maintenance.tms_backend_application.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Properties;

/**
 * Overrides the default DataSource bean to ensure the target PostgreSQL database
 * exists BEFORE Hibernate tries to connect. Only active when app.db.auto-create=true.
 */
@Configuration
@ConditionalOnProperty(prefix = "app.db", name = "auto-create", havingValue = "true")
public class DatabaseAutoCreateConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseAutoCreateConfig.class);

    @Bean
    public DataSource dataSource(DataSourceProperties properties) {
        try {
            ensureDatabaseExists(properties);
        } catch (Exception ex) {
            log.error("Database auto-create failed: {}", ex.getMessage(), ex);
        }
        // Build the actual DataSource AFTER (attempted) creation
        return properties.initializeDataSourceBuilder().build();
    }

    private void ensureDatabaseExists(DataSourceProperties properties) throws Exception {
        String jdbcUrl = properties.getUrl();
        String username = properties.getUsername();
        String password = properties.getPassword();

        if (!StringUtils.hasText(jdbcUrl) || !jdbcUrl.startsWith("jdbc:postgresql://")) {
            log.debug("Skipping auto-create (non-postgres or empty URL)");
            return;
        }
        ParsedUrl parsed = parse(jdbcUrl);
        if (!StringUtils.hasText(parsed.database)) {
            log.warn("Skipping auto-create: could not parse database name from URL {}", jdbcUrl);
            return;
        }
        String adminUrl = "jdbc:postgresql://" + parsed.hostPort + "/postgres" + (parsed.params != null ? ("?" + parsed.params) : "");
        Properties props = new Properties();
        props.setProperty("user", username);
        props.setProperty("password", password);
        try (Connection adminConn = DriverManager.getConnection(adminUrl, props); Statement st = adminConn.createStatement()) {
            String existsSql = "SELECT 1 FROM pg_database WHERE datname='" + parsed.database.replace("'","''") + "'";
            try (ResultSet rs = st.executeQuery(existsSql)) {
                if (rs.next()) {
                    log.info("[DB-AUTO-CREATE] Database '{}' already exists", parsed.database);
                    return;
                }
            }
            String createSql = "CREATE DATABASE \"" + parsed.database.replace("\"","\"\"") + "\"";
            st.executeUpdate(createSql);
            log.info("[DB-AUTO-CREATE] Created database '{}'", parsed.database);
        }
    }

    private ParsedUrl parse(String url) {
        // jdbc:postgresql://host:port/db?params
        String rest = url.substring("jdbc:postgresql://".length());
        int slash = rest.indexOf('/');
        if (slash < 0) return new ParsedUrl(rest, null, null);
        String hostPort = rest.substring(0, slash);
        String dbAndMaybeParams = rest.substring(slash + 1);
        String db;
        String params = null;
        int q = dbAndMaybeParams.indexOf('?');
        if (q >= 0) {
            db = dbAndMaybeParams.substring(0, q);
            params = dbAndMaybeParams.substring(q + 1);
        } else {
            db = dbAndMaybeParams;
        }
        return new ParsedUrl(hostPort, db, params);
    }

    private record ParsedUrl(String hostPort, String database, String params) {}
}