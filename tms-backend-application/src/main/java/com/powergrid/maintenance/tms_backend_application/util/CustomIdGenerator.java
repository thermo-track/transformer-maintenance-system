package com.powergrid.maintenance.tms_backend_application.util;

import org.hibernate.engine.spi.SharedSessionContractImplementor;
import org.hibernate.id.IdentifierGenerator;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@Component
public class CustomIdGenerator implements IdentifierGenerator {
    
    private static final String SEQUENCE_NAME = "inspection_id_seq";
    
    @Override
    public Serializable generate(SharedSessionContractImplementor session, Object object) {
        Connection connection = null;
        try {
            connection = session.getJdbcConnectionAccess().obtainConnection();

            // Create sequence if it doesn't exist
            createSequenceIfNotExists(connection);
            
            // Get next value from sequence
            PreparedStatement ps = connection.prepareStatement(
                "SELECT nextval('" + SEQUENCE_NAME + "')"
            );
            
            ResultSet rs = ps.executeQuery();
            
            if (rs.next()) {
                long nextId = rs.getLong(1);
                // Format as 9-digit string with leading zeros
                return String.format("%09d", nextId);
            }
            
            rs.close();
            ps.close();
            
        } catch (SQLException e) {
            throw new RuntimeException("Unable to generate custom ID", e);
        } finally {
            if (connection != null) {
                try {
                    session.getJdbcConnectionAccess().releaseConnection(connection);
                } catch (SQLException e) {
                    e.printStackTrace();
                }
            }
        }
        
        return "000000001"; // Default first ID
    }
    
    private void createSequenceIfNotExists(Connection connection) throws SQLException {
        // Check if sequence exists
        PreparedStatement checkPs = connection.prepareStatement(
            "SELECT 1 FROM information_schema.sequences WHERE sequence_name = ?"
        );
        checkPs.setString(1, SEQUENCE_NAME);
        ResultSet rs = checkPs.executeQuery();
        
        if (!rs.next()) {
            // Create sequence if it doesn't exist
            PreparedStatement createPs = connection.prepareStatement(
                "CREATE SEQUENCE " + SEQUENCE_NAME + " START 1 INCREMENT 1"
            );
            createPs.execute();
            createPs.close();
        }
        
        rs.close();
        checkPs.close();
    }
}