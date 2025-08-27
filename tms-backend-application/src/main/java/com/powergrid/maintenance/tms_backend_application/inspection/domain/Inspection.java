package com.powergrid.maintenance.tms_backend_application.inspection.domain; 
 
import jakarta.persistence.Column; 
import jakarta.persistence.Entity; 
import jakarta.persistence.FetchType; 
import jakarta.persistence.GeneratedValue; 
import jakarta.persistence.Id; 
import jakarta.persistence.JoinColumn; 
import jakarta.persistence.ManyToOne; 
import jakarta.persistence.Table; 
import jakarta.persistence.ForeignKey; 
 
import java.time.ZonedDateTime; 
 
import com.powergrid.maintenance.tms_backend_application.inspection.util.NineDigitId; 
import com.powergrid.maintenance.tms_backend_application.transformer.domain.Transformer; 
 
import lombok.Data; 
 
@Data 
@Entity 
@Table(name = "inspections") 
public class Inspection { 
    @Id 
    @GeneratedValue(generator = "custom-id") 
    @NineDigitId  
    @Column(name = "inspection_id", length = 9) 
    private String inspectionId; 
 
    @Column(name = "branch", nullable = false) 
    private String branch; 
 
    @Column(name = "transformer_no", nullable = false, length = 64) 
    private String transformerNo; 
 
    @Column(name = "inspection_timestamp", nullable = false) 
    private ZonedDateTime inspectionTimestamp; 

    @Column(name = "status", nullable = false) 
    private String status; 
 
    @Column(name = "environmental_condition") 
    private String environmentalCondition; 

// --- Cloudinary image metadata ---
    @Column(name = "cloud_image_url")
    private String cloudImageUrl;

    @Column(name = "cloudinary_public_id")
    private String cloudinaryPublicId;

    @Column(name = "cloud_image_name")
    private String cloudImageName;

    @Column(name = "cloud_image_type")
    private String cloudImageType;


    @Column(name = "cloud_uploaded_at")
    private ZonedDateTime cloudUploadedAt;
 
    @ManyToOne(fetch = FetchType.LAZY, optional = false) 
    @JoinColumn( 
        name = "transformer_no", 
        referencedColumnName = "transformer_no", 
        insertable = false, updatable = false, 
        foreignKey = @ForeignKey(name = "fk_inspections_transformer_no") 
    ) 
    private Transformer transformer;  

    public boolean hasCloudImage() {
        return cloudImageUrl != null && !cloudImageUrl.isEmpty();
    }
 
}