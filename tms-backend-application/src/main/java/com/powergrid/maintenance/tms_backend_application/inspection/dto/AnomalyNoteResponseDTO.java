package com.powergrid.maintenance.tms_backend_application.inspection.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyNoteResponseDTO {
    
    private Long id;
    private Long anomalyId;
    private String note;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}