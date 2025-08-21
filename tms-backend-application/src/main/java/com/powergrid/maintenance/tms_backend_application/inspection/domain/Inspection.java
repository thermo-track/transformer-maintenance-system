package com.powergrid.maintenance.tms_backend_application.inspection.domain;

import com.powergrid.maintenance.tms_backend_application.inspection.util.NineDigitId;
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Entity
@Table(name = "inspections")
public class Inspection {

    @Id
    @GeneratedValue
    @NineDigitId
    @Column(name = "inspection_id", length = 9)
    private String inspectionId;

    @Column(name = "branch", nullable = false)
    private String branch;

    // ✅ store the business key and expose it in DTOs
    @Column(name = "transformer_no", nullable = false, length = 64)
    private String transformerNo;

    @Column(name = "date_of_inspection", nullable = false)
    private LocalDate dateOfInspection;

    @Column(name = "time_of_inspection", nullable = false)
    private LocalTime timeOfInspection;

    // ✅ read-only association to drive FK creation (no payload changes needed)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "transformer_no",
        referencedColumnName = "transformer_no",
        insertable = false, updatable = false,
        foreignKey = @ForeignKey(name = "fk_inspections_transformer_no")
    )
    private Transformer transformer;
}
